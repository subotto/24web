'use strict';

angular.module('24ore.stats', [])
  .controller('StatsCtrl', function($scope, $stateParams, $http) {
    $scope.$stateParams = $stateParams;
    $http.post("stats", {year: $scope.$stateParams.year})
      .success(function(data, status, headers, config) {
        for(var d in data)
          $scope[d] = data[d];
        $scope["goal_data"] = [];
        $scope["player_data"] = [];
        var years = [];
        for(var year in data["team0"]["participations"]) {
          var tmp = {x: year};
          tmp[data["team0"]["name"]] = data["team0"]["participations"][year]["goals"];
          tmp[data["team1"]["name"]] = data["team1"]["participations"][year]["goals"];
          $scope["goal_data"].push(tmp);
          tmp = {x: year};
          tmp[data["team0"]["name"]] = data["team0"]["participations"][year]["players"];
          tmp[data["team1"]["name"]] = data["team1"]["participations"][year]["players"];
          $scope["player_data"].push(tmp);
          years.push(parseInt(year));
        }
        $scope.bar_options.axes.x.ticks = years;
        $scope.bar_options.axes.x.min = years[0]-1;
        $scope.bar_options.axes.x.max = years[years.length-1]+1;
      })
      .error(function(data, status, headers, config) {
        console.log("Error!");
      })
    if ($scope.$stateParams.year != 'all')
    $http.post("score", {year: $scope.$stateParams.year, action: 'getevents'})
      .success(function(data, status, headers, config) {
          $scope.score_data = [];
          var time_max = 0;
          var score = {};
          for (var team in data) {
            score[team] = 0;
            for (var i=1; i<data[team].length; i++) {
              data[team][i] += data[team][i-1];
              time_max = time_max > data[team][i]? time_max : data[team][i];
            }
          }
          var step = Math.ceil(time_max/500);
          for (var time = 0; time < time_max; time += step) {
            for (var team in data) {
              while(score[team] < data[team].length && data[team][score[team]] < time)
                score[team]++;
            }
            var point = {x: time}
            for (var team in data)
              point[team] = score[team];
            $scope.score_data.push(point);
          }
          var point = {x: time_max}
          for (var team in data)
            point[team] = score[team];
          $scope.score_data.push(point);
          $scope.score_options.axes.x.ticks = [0];
          for (var i=0; i<time_max; i+= 3600)
            $scope.score_options.axes.x.ticks.push(i+3600);
      })
      .error(function(data, status, headers, config) {
        console.log("Error!");
      })
    $scope.players_predicate = "name";
    $scope.players_reverse = false;
    $scope.details_predicate = "name";
    $scope.details_reverse = false;
    $scope.pairs_predicate = "name1";
    $scope.pairs_reverse = false;
    $scope.update_predicate = function (type, pred) {
      if ($scope[type + "_predicate"] == pred)
        $scope[type + "_reverse"] = !$scope[type + "_reverse"];
      else {
        $scope[type + "_predicate"] = pred;
        $scope[type + "_reverse"] = false;
      }
    }
    $scope.bar_options = {
      axes: {
        x: {
          labelFunction: function (x) {return "" + x}
        },
        y: {
          min: 0,
          labelFunction: function (x) {return "" + x}
        }
      },
      series: [{
        y: 'Matematici',
        color: 'red',
        type: 'column',
      }, {
        y: 'Fisici',
        color: 'blue',
        type: 'column',
      }],
      tooltip: {}
    }
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
