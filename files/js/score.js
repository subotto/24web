'use strict';

angular.module('24ore.score', [])
  .factory('scoreManager', function($http, $timeout, $window) {
    $window.scoreData = {}
    $window.scoreData.red = {
      team: "Matematici",
      score: "-1",
      partial_score: "-1",
      attacker: {
        name: "-",
        matches: "-1",
        play_time: "0h 0m",
        total_time: "0h 0m",
        goals: "-1",
        total_goals: "-1"
      },
      defender: {
        name: "-",
        matches: "-1",
        play_time: "0h 0m",
        total_time: "0h 0m",
        goals: "-1",
        total_goals: "-1"
      }
    }
    $window.scoreData.blue = {
      team: "Fisici",
      score: "-1",
      partial_score: "-1",
      attacker: {
        name: "-",
        matches: "-1",
        play_time: "0h 0m",
        total_time: "0h 0m",
        goals: "-1",
        total_goals: "-1"
      },
      defender: {
        name: "-",
        matches: "-1",
        play_time: "0h 0m",
        total_time: "0h 0m",
        goals: "-1",
        total_goals: "-1"
      }
    }
    $window.scoreData.goal_difference = -1;
    $window.scoreData.total_goals = -1;
    $window.scoreData.goals_rate = 0.0;
    $window.scoreData.partial_time = "0 minuti";
    $window.scoreData.winning_team = "Matematici";
    $window.scoreData.losing_team = "Fisici";
    $window.scoreData.goalidx = "∞";
    var scoreUpdate = function () {
      $window.scoreUpdateTimeout = $timeout(scoreUpdate, 1000);
      $http.post("score", {action: "get"})
        .success(function(data, status, headers, config) {
          for (var i in data)
            $window.scoreData[i] = data[i];
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
    var currentYear = 2014;
    $scope.UI = "graphic";
    $scope.graph = "full";
    $http.post("score", {year: currentYear-1, action: 'getevents'})
      .success(function(data, status, headers, config) {
        $scope.olddata = data;
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
          for (var team in $scope.olddata)
            data[team + " (old)"] = $scope.olddata[team].slice();
          for (var team in data) {
            score[team] = 0;
            for (var i=1; i<data[team].length; i++) {
              data[team][i] += data[team][i-1];
              time_max = time_max > data[team][i]? time_max : data[team][i];
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
          for (var i=0; i<time_max; i+= 7200)
            $scope.score_options.axes.x.ticks.push(i+7200);
      })
      .error(function(data, status, headers, config) {
        console.log("Error!");
      })
    }
    graphUpdate();
    $scope.score_data = [];
    $scope.score_last_data = [];
    $scope.score_options = {
      axes: {
        x: {
          labelFunction: function (x) {
            return Math.floor(x/3600);
          }
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
          labelFunction: function (x) {
            x = Math.floor(x/60);
            var hours = Math.floor(x/60);
            var minutes = x - hours*60;
            return hours + ":" + minutes; 
          }
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
