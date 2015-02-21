'use strict';

angular.module('24ore.score', [])
  .factory('scoreManager', function($http, $timeout, $window) {
    $window.scoreData = {}
    var scoreUpdate = function () {
      $window.scoreUpdateTimeout = $timeout(scoreUpdate, 1000);
      $http.post("score", {action: "get"})
        .success(function(data, status, headers, config) {
          for (var i in data)
            $window.scoreData[i] = data[i];
          for (var t in data.teams)
            data.teams[data.teams[t].color] = data.teams[t];
        })
        .error(function(data, status, headers, config) {
          console.log("Error!");
       })
    }
    if (typeof $window.scoreUpdateTimeout == 'undefined') {
        $window.scoreUpdateTimeout = {};
        scoreUpdate();
    }
    return $window.scoreData;
  })
  .controller('ScoreCtrl', function($scope, $timeout, $http, scoreManager) {
    var currentYear = 2015;
    $scope.start_svg = start_svg;
    $scope.stop_svg = stop_svg;
    $scope.UI = "graphic";
    $timeout(init_field, 400);
    $scope.graph = "full";
    $scope.time = "elapsed";
    $http.post("score", {year: currentYear-1, action: 'getevents'})
      .success(function(data, status, headers, config) {
        $scope.olddata = data;
        graphUpdate();
      })
      .error(function(data, status, headers, config) {
        console.log("Error!");
      })
    $scope.score = scoreManager;
    var graphUpdate = function() {
      // Una volta ogni 10s
      $timeout(graphUpdate, 10000); 
      $http.post("score", {year: currentYear, action: 'getevents'})
      .success(function(data, status, headers, config) {
          $scope.score_data = [];
          $scope.score_last_data = [];
          var time_max = 0;
          var score = {};
          for (var team in data) {
            score[team] = 0;
            for (var i=1; i<data[team].length; i++) {
              data[team][i] += data[team][i-1];
              time_max = time_max > data[team][i]? time_max : data[team][i];
            }
          }
          for (var team in $scope.olddata) {
            data[team + " (old)"] = $scope.olddata[team].slice();
            team = team + " (old)";
            score[team] = 0;
            for (var i=1; i<data[team].length; i++) {
              data[team][i] += data[team][i-1];
            }
          }
          var step = Math.ceil(time_max/400);
          for (var time = 0; time < time_max; time += step) {
            for (var team in data) {
              while(score[team] < data[team].length && data[team][score[team]] < time)
                score[team]++;
            }
            var point = {x: time}
            for (var team in data)
              point[team] = score[team];
            $scope.score_data.push(point);
            if (time_max - time < 1800)
              $scope.score_last_data.push(point);
          }
          var point = {x: time_max}
          for (var team in data)
            point[team] = score[team];
          $scope.score_data.push(point);
          $scope.score_last_data.push(point);
          $scope.score_options.axes.x.ticks = [0];
          var nsteps = 10
          for (var i=0; i<nsteps; i++)
            $scope.score_options.axes.x.ticks.push((i+1)*time_max/nsteps);
      })
      .error(function(data, status, headers, config) {
        console.log("Error!");
      })
    }
    var _time = function(time) {
      if (time == 0) return "0";
      var time = Math.floor(time);
      var hours = Math.floor(time / 3600);
      var minutes = Math.floor(time/60 - hours*60);
      var seconds = Math.floor(time - hours*3600 - minutes*60);
      var v1 = "" + hours;
      var v2 = "" + minutes;
      if (v1.length < 2) v1 = "0" + v1;
      if (v2.length < 2) v2 = "0" + v2;
      return v1 + ":" + v2;
    }

//    graphUpdate();
    $scope.score_data = [];
    $scope.score_last_data = [];
    $scope.score_options = {
      axes: {
        x: {
          labelFunction: _time
        },
        y: {
          labelFunction: function (x) {return "" + x}
        }
      },
      series: [{
        y: 'Matematici',
        color: 'red',
        drawDots: false,
      }, {
        y: 'Fisici',
        color: 'blue',
        drawDots: false,
      }, {
        y: 'Matematici (old)',
        color: 'red',
        drawDots: false,
        lineMode: 'dashed'
      }, {
        y: 'Fisici (old)',
        color: 'blue',
        drawDots: false,
        lineMode: 'dashed'
      }],
      tooltip: {
        formatter: function(x, y, series) {
            x = Math.floor(x/60);
            var hours = Math.floor(x/60);
            var minutes = x - hours*60;
            return series.y + " " + hours + ":" + minutes + " - " + y; 
        }
      }
    };
    $scope.score_last_options = {
      axes: {
        x: {
          labelFunction: _time
        },
        y: {
          labelFunction: function (x) {return "" + x}
        }
      },
      series: [{
        y: 'Matematici',
        color: 'red',
        drawDots: false
      }, {
        y: 'Fisici',
        color: 'blue',
        drawDots: false
      }],
      tooltip: {
        formatter: function(x, y, series) {
            x = Math.floor(x/60);
            var hours = Math.floor(x/60);
            var minutes = x - hours*60;
            return series.y + " " + hours + ":" + minutes + " - " + y; 
        }
      }
    };
  })
