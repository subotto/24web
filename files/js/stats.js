'use strict';

angular.module('24ore.stats', [])
  .controller('StatsCtrl', function($scope, $stateParams, $http) {
    $scope.$stateParams = $stateParams;
    $http.post("stats", {year: $scope.$stateParams.year})
      .success(function(data, status, headers, config) {
        for(var d in data)
          $scope[d] = data[d];
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
  })
