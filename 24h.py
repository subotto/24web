#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import gevent
import gevent.monkey

gevent.monkey.patch_all()

import psycogreen.gevent
psycogreen.gevent.patch_psycopg()

import psycopg2
import json
import os
import time
from werkzeug.wsgi import SharedDataMiddleware, responder
from werkzeug.wrappers import Request, Response
from werkzeug.serving import run_simple
from werkzeug.exceptions import BadRequest, NotFound, Unauthorized, HTTPException
from werkzeug.routing import Map, Rule

import conf

conn = psycopg2.connect(conf.db)

file_path = os.path.join(os.path.dirname(__file__), 'files/')

class SubottoWeb(object):
    def __init__(self):
        with open("score.json", "r") as f:
            self.score = json.load(f)
        self.json_time = time.time()
        self.router = Map([
            Rule('/', methods=['GET', 'POST'], endpoint='root'),
            Rule('/score', methods=['POST'], endpoint='score'),
            Rule('/stats', methods=['POST'], endpoint='stats'),
            Rule('/player', methods=['POST'], endpoint='player')
        ], encoding_errors='strict')

    def score_handler(self, data):
        if 'action' not in data:
            raise BadRequest()
        if data['action'] == "get":
            return self.score
        elif data['action'] == "set":
            if 'pw' not in data or data['pw'] != conf.scorepw:
                raise Unauthorized()
            if 'field' not in data or 'value' not in data:
                raise BadRequest()
            try:
                obj = self.score
                fields = data['field'].split('.')
                for f in fields[:-1]:
                    obj = obj[f]
                obj[fields[-1]] = data['value']
                ct = time.time()
                if ct - self.json_time > 10:
                    self.json_time = ct
                    with open("score.json", "w") as f:
                        json.dump(self.score, f)
                    return "OK, status saved"
                return "OK"
            except:
                raise BadRequest()
        elif data['action'] == 'getevents':
            if 'year' not in data:
                raise BadRequest()
            cur = conn.cursor()
            cur.execute("""
                SELECT EXTRACT(EPOCH FROM timestamp - "begin")::Integer as sec,
                       teams.name, type FROM events
                INNER JOIN matches ON matches.id = match_id
                INNER JOIN teams ON teams.id = team_id
                WHERE (type = 'goal' or type = 'goal_undo') AND year = %s
                ORDER BY sec;""", (data['year'],))
            scores = dict()
            for event in cur.fetchall():
                if event[1] not in scores:
                    scores[event[1]] = []
                if event[2] == 'goal':
                    scores[event[1]].append(event[0])
                elif event[2] == 'goal_undo':
                    scores[event[1]].pop()
            for k in scores.iterkeys():
                for l in xrange(len(scores[k])-1, 0, -1):
                    scores[k][l] -= scores[k][l-1]
            return scores
        else:
            raise BadRequest()

    def stats_handler(self, data):
        Int = lambda x: int(x) if x is not None else 0
        cur = conn.cursor()
        ret = dict()
        match_id = None;
        if data['year'] != 'all':
            # ID dell'edizine
            cur.execute("SELECT id FROM matches WHERE year = %s;", (data['year'],))
            match_id = cur.fetchone()
            if match_id is None:
                raise NotFound()
            match_id = match_id[0]
            # Orari e posto
            cur.execute("""
                SELECT "begin", "end", "place" FROM matches
                WHERE id = %s""", (match_id,))
            row = cur.fetchone()
            ret["edition"] = {
                "start": row[0].strftime("%A %d/%m/%Y, %H:%M"),
                "stop": row[1].strftime("%A %d/%m/%Y, %H:%M"),
                "place": row[2]
            }
        for i in [1, 2]:
            res = dict()
            # Nome della squadra
            cur.execute("SELECT name FROM teams WHERE id = %s;", (i,))
            res["name"] = cur.fetchone()[0]
            if match_id is None:
                # Totale di goal della squadra
                cur.execute("""
                    SELECT SUM(score_a * CAST(matches.team_a_id = %s AS integer) +
                               score_b * CAST(matches.team_b_id = %s AS integer)) FROM stats_turns 
                    INNER JOIN matches ON matches.id = stats_turns.match_id;""", (i, i))
                res["goals"] = int(cur.fetchone()[0])
            # Numero di giocatori
            cur.execute("""
                SELECT COUNT(*) FROM (
                    SELECT DISTINCT player_id
                    FROM stats_player_matches
                    INNER JOIN players ON player_id = players.id
                    WHERE team_id = %s AND (players.fname != '??' OR players.lname != '??')
                ) AS temp;""", (i,))
            res["players"] = int(cur.fetchone()[0])
            res["participations"] = dict()
            # Nomi e id di capitani e vicecapitani, per ogni anno
            cur.execute("""
                SELECT temp.*, cap.fname, cap.lname, dep.fname, dep.lname FROM (
                    SELECT team_a_captain_id AS captain_id,
                           team_a_deputy_id  AS deputy_id,
                           year FROM matches
                    WHERE team_a_id = %s AND year IS NOT NULL
                    UNION
                    SELECT team_b_captain_id AS captain_id,
                           team_b_deputy_id  AS deputy_id,
                           year FROM matches
                    WHERE team_b_id = %s AND year IS NOT NULL
                ) AS temp
                INNER JOIN players AS cap ON cap.id = captain_id
                INNER JOIN players AS dep ON dep.id = deputy_id
                ORDER BY year;""", (i, i))
            for row in cur.fetchall():
                res["participations"][row[2]] = {
                    "captain": {
                        "name": row[3] + " " + row[4],
                        "id": row[0]
                    },
                    "deputy": {
                        "name": row[5] + " " + row[6],
                        "id": row[1]
                    },
                    "year": row[2]
                }
            ret["team%s" % (i-1)] = res
            # Nomi e id delle prime coppie, per ogni anno
            cur.execute("""
                SELECT matches.year,
                       p0.id, p0.fname, p0.lname,
                       p1.id, p1.fname, p1.lname
                FROM stats_turns
                INNER JOIN matches ON matches.id = match_id
                INNER JOIN players AS p0 ON CASE
                    WHEN matches.team_a_id = %s THEN p00_id = p0.id
                    ELSE p10_id = p0.id END
                INNER JOIN players AS p1 ON CASE
                    WHEN matches.team_a_id = %s THEN p01_id = p1.id
                    ELSE p11_id = p1.id END
                WHERE matches.begin = stats_turns.begin AND
                      (matches.team_a_id = %s OR matches.team_b_id = %s);
            """, (i, i, i, i));
            for row in cur.fetchall():
                res["participations"][row[0]]["first_pair"] = [{
                    "name": row[2] + " " + row[3],
                    "id": row[1]
                }, {
                    "name": row[5] + " " + row[6],
                    "id": row[4]
                }]
            # Numero di goal per anno
            cur.execute("""
                SELECT matches.year,
                       SUM(score_a * CAST(matches.team_a_id = %s AS integer) +
                           score_b * CAST(matches.team_b_id = %s AS integer))
                FROM stats_turns
                INNER JOIN matches ON matches.id = stats_turns.match_id
                GROUP BY matches.year;""", (i, i))
            for row in cur.fetchall():
                res["participations"][row[0]]["goals"] = row[1]
            # Numero di partecipanti per anno
            cur.execute("""
                SELECT year, COUNT(player_id) FROM (
                    SELECT DISTINCT matches.year, player_id
                    FROM stats_player_matches
                    INNER JOIN matches ON matches.id = match_id
                    INNER JOIN players ON player_id = players.id
                    WHERE team_id = %s AND (players.fname != '??' OR players.lname != '??')
                ) AS temp GROUP BY year;""", (i,))
            for row in cur.fetchall():
                res["participations"][row[0]]["players"] = row[1]
        # Elenco partecipanti
        if match_id is None:
            cur.execute("""
                SELECT fname, lname, players.id,
                       SUM(seconds), SUM(pos_goals),
                       ARRAY_AGG(team_id), ARRAY_AGG(matches.year)
                FROM stats_player_matches
                INNER JOIN players ON players.id = player_id
                INNER JOIN matches ON match_id = matches.id
                WHERE fname != '??' OR lname != '??'
                GROUP BY players.id, fname, lname;""")
        else:
            cur.execute(""" 
                SELECT fname, lname, players.id,
                       SUM(seconds), SUM(pos_goals),
                       ARRAY_AGG(team_id), ARRAY_AGG(matches.year)
                FROM stats_player_matches
                INNER JOIN players ON players.id = player_id
                INNER JOIN matches ON match_id = matches.id
                WHERE (fname != '??' OR lname != '??') AND match_id = %s
                GROUP BY players.id, fname, lname;""", (match_id,))
        ret["players"] = []
        for player in cur.fetchall():
            p = {
                "name": player[0] + " " + player[1],
                "id": player[2],
                "play_time": player[3]/60,
                "goals": player[4],
                "team": dict()
            }
            for t, y in zip(player[5], player[6]):
                if ret["team%s" % (t-1)]["name"] not in p["team"]:
                    p["team"][ret["team%s" % (t-1)]["name"]] = []
                p["team"][ret["team%s" % (t-1)]["name"]].append(y)
            ret["players"].append(p)
        # Statistiche dettagliate
        ret["play_limit"] = 120 if match_id is None else 20
        if match_id is None:
            cur.execute("""
                SELECT * FROM (
                    SELECT fname, lname, players.id,
                           SUM(seconds) AS s, SUM(pos_goals) AS pg, SUM(neg_goals) AS ng,
                           ARRAY_AGG(team_id), ARRAY_AGG(matches.year)
                    FROM stats_player_matches
                    INNER JOIN players ON players.id = player_id
                    INNER JOIN matches ON match_id = matches.id
                    WHERE (fname != '??' OR lname != '??')
                    GROUP BY players.id, fname, lname
                ) AS temp
                WHERE pg > ng AND s > %s;""", (ret["play_limit"]*60,))
        else:
            cur.execute(""" 
                SELECT * FROM (
                    SELECT fname, lname, players.id,
                           SUM(seconds) AS s, SUM(pos_goals) AS pg, SUM(neg_goals) AS ng,
                           ARRAY_AGG(team_id), ARRAY_AGG(matches.year)
                    FROM stats_player_matches
                    INNER JOIN players ON players.id = player_id
                    INNER JOIN matches ON match_id = matches.id
                    WHERE (fname != '??' OR lname != '??') AND match_id = %s
                    GROUP BY players.id, fname, lname
                ) AS temp
                WHERE pg > ng AND s > %s;""", (match_id, ret["play_limit"]*60))
        ret["player_details"] = []
        for player in cur.fetchall():
            p = {
                "name": player[0] + " " + player[1],
                "id": player[2],
                "play_time": player[3]/60,
                "goals_made": player[4],
                "goals_taken": player[5],
                "team": dict()
            }
            for t, y in zip(player[6], player[7]):
                if ret["team%s" % (t-1)]["name"] not in p["team"]:
                    p["team"][ret["team%s" % (t-1)]["name"]] = []
                p["team"][ret["team%s" % (t-1)]["name"]].append(y)
            ret["player_details"].append(p)
        # Coppie
        if match_id is None:
            cur.execute("""
                SELECT p0.id, p0.fname, p0.lname,
                       p1.id, p1.fname, p1.lname,
                       pos_score, neg_score, seconds
                FROM (
                    SELECT p0_id, p1_id,
                           SUM(pos_score) as pos_score,
                           SUM(neg_score) as neg_score,
                           SUM(seconds) as seconds
                    FROM (
                        SELECT p00_id as p0_id, p01_id as p1_id,
                               score_a as pos_score, score_b as neg_score,
                               EXTRACT(EPOCH FROM "end" - "begin")::Integer as seconds,
                               match_id
                        FROM stats_turns
                        UNION ALL
                        SELECT p10_id as p0_id, p11_id as p1_id,
                               score_b as pos_score, score_b as neg_score,
                               EXTRACT(EPOCH FROM "end" - "begin")::Integer as seconds,
                               match_id
                        FROM stats_turns
                    ) AS temp
                    GROUP BY p0_id, p1_id
                ) AS temp
                INNER JOIN players as p0 on p0.id = p0_id
                INNER JOIN players as p1 on p1.id = p1_id
                WHERE pos_score > neg_score
                ORDER BY seconds DESC 
                LIMIT 60;""")
        else:
            cur.execute("""
                SELECT p0.id, p0.fname, p0.lname,
                       p1.id, p1.fname, p1.lname,
                       pos_score, neg_score, seconds
                FROM (
                    SELECT p0_id, p1_id,
                           SUM(pos_score) as pos_score,
                           SUM(neg_score) as neg_score,
                           SUM(seconds) as seconds
                    FROM (
                        SELECT p00_id as p0_id, p01_id as p1_id,
                               score_a as pos_score, score_b as neg_score,
                               EXTRACT(EPOCH FROM "end" - "begin")::Integer as seconds,
                               match_id
                        FROM stats_turns
                        UNION
                        SELECT p10_id as p0_id, p11_id as p1_id,
                               score_b as pos_score, score_b as neg_score,
                               EXTRACT(EPOCH FROM "end" - "begin")::Integer as seconds,
                               match_id
                        FROM stats_turns
                    ) AS temp
                    WHERE match_id = %s
                    GROUP BY p0_id, p1_id
                ) AS temp
                INNER JOIN players as p0 on p0.id = p0_id
                INNER JOIN players as p1 on p1.id = p1_id
                WHERE pos_score > neg_score
                ORDER BY seconds DESC 
                LIMIT 60;""", (match_id,))
        ret["pairs"] = []
        for row in cur.fetchall():
            ret["pairs"].append({
                "name1": row[1] + " " + row[2],
                "name2": row[4] + " " + row[5],
                "id1": row[0],
                "id2": row[3],
                "play_time": row[8]/60,
                "goals_made": row[6],
                "goals_taken": row[7]
            })
        return ret

    def player_handler(self, data):
        cur = conn.cursor()
        if "id" not in data or "year" not in data:
            raise BadRequest()
        cur.execute("""
            SELECT players.id, fname, lname,
                   year, teams.name, pos_goals, neg_goals, seconds
            FROM players
            INNER JOIN player_matches ON players.id = player_matches.player_id 
            INNER JOIN matches ON match_id = matches.id
            INNER JOIN teams ON teams.id = team_id 
            INNER JOIN stats_player_matches ON players.id = stats_player_matches.player_id
                                            AND matches.id = stats_player_matches.match_id
            WHERE year IS NOT NULL AND players.id = %s;""", (data["id"],))
        res = cur.fetchall()
        if len(data) == 0:
            raise NotFound()
        years = map(lambda x: x[3], res)
        teams = map(lambda x: x[4], res)
        play_time = map(lambda x: x[7]/60, res)
        goals_made = map(lambda x: x[5], res)
        goals_taken = map(lambda x: x[6], res)
        ret = {
            "name": res[0][1] + " " + res[0][2],
            "id": res[0][0],
            "years": years,
            "team": dict(zip(map(str, years), teams))
        }
        if data['year'] == 'all':
            ret["play_time"] = sum(play_time)
            ret["goals_made"] = sum(goals_made)
            ret["goals_taken"] = sum(goals_taken)
        else:
            try:
                yr = int(data['year'])
                ret["play_time"] = dict(zip(years, play_time))[yr]
                ret["goals_made"] = dict(zip(years, goals_made))[yr]
                ret["goals_taken"] = dict(zip(years, goals_taken))[yr]
            except:
                raise NotFound()
        if data['year'] == 'all':
            cur.execute("""
                SELECT other, fname, lname, SUM(seconds) FROM (
                    SELECT CASE WHEN p0_id = %s THEN p1_id ELSE p0_id END AS other, seconds
                    FROM (
                        SELECT p00_id AS p0_id, p01_id AS p1_id,
                               (EXTRACT(EPOCH FROM "end" - "begin"))::Integer AS seconds 
                        FROM stats_turns
                        UNION
                        SELECT p10_id AS p0_id, p11_id AS p1_id,
                               (EXTRACT(EPOCH FROM "end" - "begin"))::Integer AS seconds
                        FROM stats_turns
                    ) AS temp
                    WHERE p0_id = %s or p1_id = %s
                ) AS temp
                INNER JOIN players ON other = id
                GROUP BY other, fname, lname;""", (data["id"], data["id"], data["id"]))
        else:
            cur.execute("""
                SELECT other, fname, lname, SUM(seconds) FROM (
                    SELECT CASE WHEN p0_id = %s THEN p1_id ELSE p0_id END AS other, seconds
                    FROM (
                        SELECT p00_id AS p0_id, p01_id AS p1_id, match_id,
                               (EXTRACT(EPOCH FROM "end" - "begin"))::Integer AS seconds 
                        FROM stats_turns
                        UNION
                        SELECT p10_id AS p0_id, p11_id AS p1_id, match_id,
                               (EXTRACT(EPOCH FROM "end" - "begin"))::Integer AS seconds
                        FROM stats_turns
                    ) AS temp
                    INNER JOIN matches ON match_id = matches.id
                    WHERE (p0_id = %s OR p1_id = %s) AND matches.year = %s
                ) AS temp
                INNER JOIN players ON other = id
                GROUP BY other, fname, lname;""", (data["id"], data["id"], data["id"], yr))
        ret['partners'] = []
        for row in cur.fetchall():
            ret['partners'].append({
                "name": row[1] + " " + row[2],
                "id": row[0],
                "play_time": row[3]/60
            })
        if data['year'] == 'all':
            cur.execute("""
                SELECT p_id, fname, lname, SUM(seconds) FROM (
                    WITH adversaries AS (
                        SELECT p00_id AS p0_id, p01_id AS p1_id,
                               (EXTRACT(EPOCH FROM "end" - "begin"))::Integer AS seconds
                        FROM stats_turns
                        WHERE (p10_id = %s OR p11_id = %s)
                        UNION
                        SELECT p10_id AS p0_id, p11_id AS p1_id,
                               (EXTRACT(EPOCH FROM "end" - "begin"))::Integer AS seconds
                        FROM stats_turns
                        WHERE (p00_id = %s or p01_id = %s)
                    )
                    SELECT p0_id AS p_id, seconds FROM adversaries
                    UNION
                    SELECT p1_id AS p_id, seconds FROM adversaries)
                AS temp
                INNER JOIN players ON p_id = players.id
                WHERE fname != '??' OR lname != '??'
                GROUP BY p_id, fname, lname;""",
                (data["id"], data["id"], data["id"], data["id"]))
        else:
            cur.execute("""
                SELECT p_id, fname, lname, SUM(seconds) FROM (
                    WITH adversaries AS (
                        SELECT p00_id AS p0_id, p01_id AS p1_id,
                               (EXTRACT(EPOCH FROM st.end - st.begin))::Integer AS seconds
                        FROM stats_turns AS st
                        INNER JOIN matches ON matches.id = match_id
                        WHERE matches.year = %s AND (p10_id = %s OR p11_id = %s)
                        UNION
                        SELECT p10_id AS p0_id, p11_id AS p1_id,
                               (EXTRACT(EPOCH FROM st.end - st.begin))::Integer AS seconds
                        FROM stats_turns AS st
                        INNER JOIN matches ON matches.id = match_id
                        WHERE matches.year = %s AND (p00_id = %s or p01_id = %s)
                    )
                    SELECT p0_id AS p_id, seconds FROM adversaries
                    UNION
                    SELECT p1_id AS p_id, seconds FROM adversaries)
                AS temp
                INNER JOIN players ON p_id = players.id
                WHERE fname != '??' OR lname != '??'
                GROUP BY p_id, fname, lname;""",
                (yr, data["id"], data["id"], yr, data["id"], data["id"]))
        ret['adversaries'] = []
        for row in cur.fetchall():
            ret['adversaries'].append({
                "name": row[1] + " " + row[2],
                "id": row[0],
                "play_time": row[3]/60
            })
        if data['year'] == 'all':
            cur.execute("""
                SELECT "begin", "end" FROM stats_turns
                WHERE p00_id = %s OR p01_id = %s OR p10_id = %s OR p11_id = %s;""",
                (data['id'], data['id'], data['id'], data['id']))
        else:
            cur.execute("""
                SELECT st.begin, st.end FROM stats_turns AS st
                INNER JOIN matches ON matches.id = match_id
                WHERE matches.year = %s AND 
                      (p00_id = %s OR p01_id = %s OR p10_id = %s OR p11_id = %s);""",
                (data['year'], data['id'], data['id'], data['id'], data['id']))
        ret['periods'] = map(lambda x: map(lambda y: (y.hour, y.minute), x), cur.fetchall())
        return ret

    @responder
    def __call__(self, environ, start_response):
        route = self.router.bind_to_environ(environ)
        try:
            endpoint, args = route.match()
        except HTTPException:
            return NotFound()
        
        if endpoint == 'root':
            with open(os.path.join(file_path, "index.html"), "r") as f:
                data = f.read()
            return Response(data, mimetype='text/html')

        request = Request(environ)
        if request.mimetype != "application/json":
            return BadRequest()
        try:
            data = json.load(request.stream)
        except:
            return BadRequest()
        try:
            if endpoint == 'score':
                data = self.score_handler(data)
            elif endpoint == 'stats':
                data = self.stats_handler(data)
            elif endpoint == 'player':
                data = self.player_handler(data)
        except HTTPException as e:
            return e

        response = Response()
        response.mimetype = "application/json"
        response.status_code = 200
        response.data = json.dumps(data, separators=(',', ':'))
        return response

run_simple(
    '',
    8080,
    SubottoWeb(),
    use_debugger=True,
    use_reloader=True,
    static_files={'/files': file_path})
