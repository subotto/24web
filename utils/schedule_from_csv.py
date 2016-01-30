#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import sys

def divide_name(name):
    splitted = name.split(" ")
    if len(splitted) == 2:
        return splitted[0], splitted[1], ''
    else:
        return splitted[0], " ".join(splitted[1:]), 'occhio'

prev_time = None
for line in sys.stdin:
    fields = line.strip().split(',')
    time = fields[0]
    if prev_time is not None:
        if 'schedule' in sys.argv:
            print "<tr><td>%s - %s</td><td>%s, %s</td><td>%s, %s</td></tr>" % (prev_time.replace('.', ':'), time.replace('.', ':'), mat_def, mat_att, phy_def, phy_att)
        elif 'maths' in sys.argv:
            print ",".join(divide_name(mat_def))
            print ",".join(divide_name(mat_att))
        elif 'physics' in sys.argv:
            print ",".join(divide_name(phy_def))
            print ",".join(divide_name(phy_att))
    phy_def, phy_att, mat_def, mat_att = fields[1:]
    prev_time = time
