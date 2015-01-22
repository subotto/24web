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
  .controller('ScoreCtrl', function($scope, scoreManager) {
    $scope.score = scoreManager;
  })
