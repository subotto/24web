'use strict';

angular.module('24ore.player', [])
  .controller('PlayerCtrl', function($scope, $stateParams, $http) {
    $scope.$stateParams = $stateParams;
    $scope.update_predicate = function (type, pred) {
      if ($scope[type + "_predicate"] == pred)
        $scope[type + "_reverse"] = !$scope[type + "_reverse"];
      else {
        $scope[type + "_predicate"] = pred;
        $scope[type + "_reverse"] = false;
      }
    }
    $scope.partners_predicate = "name";
    $scope.partners_reverse = false;
    $scope.adversaries_predicate = "name";
    $scope.adversaries_reverse = false;
    $scope.player = {};
    $http.post("player", {id: $scope.$stateParams.id, year: $scope.$stateParams.year})
      .success(function(data, status, headers, config) {
        for(var d in data)
          $scope.player[d] = data[d];
        var times = [];
        for(var i=0; i<24; i++)
          times.push(0);
        for(var p in data["periods"]) {
          var t = data["periods"][p];
          if (t[0][0] == t[1][0])
            times[t[0][0]] += t[1][1] - t[0][1];
          else {
            times[t[0][0]] += 60 - t[0][1];
            times[t[1][0]] += t[1][1];
          }
        }
        $scope.hours_data = []
        for(var i=0; i<24; i++)
          $scope.hours_data.push({x: i, Minuti: times[i]})
      })
      .error(function(data, status, headers, config) {
        console.log("Error!");
      })
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
        y: 'Minuti',
        color: 'red',
        type: 'column',
      }],
      tooltip: {}
    }
  })
