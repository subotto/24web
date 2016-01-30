#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import sys

prev_time = None
for line in sys.stdin:
    fields = line.strip().split(',')
    time = fields[0]
    if prev_time is not None:
        print "<tr><td>%s - %s</td><td>%s, %s</td><td>%s, %s</td></tr>" % (prev_time.replace('.', ':'), time.replace('.', ':'), mat_def, mat_att, phy_def, phy_att)
    phy_def, phy_att, mat_def, mat_att = fields[1:]
    prev_time = time
