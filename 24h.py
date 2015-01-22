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
            Rule('/<target>', methods=['POST'], endpoint='jsondata')
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
        else:
            raise BadRequest()

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
            if args['target'] == 'score':
                data = self.score_handler(data)
            else:
                return NotFound()
        except HTTPException as e:
            return e

        response = Response()
        response.mimetype = "application/json"
        response.status_code = 200
        response.data = json.dumps(data)
        return response

run_simple(
    '',
    8080,
    SubottoWeb(),
    use_debugger=True,
    use_reloader=True,
    static_files={'/files': file_path})
