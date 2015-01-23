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
/*    $scope.player = {
      name: "Giulio Bresciani",
      id: "1",
      years: ["2010", "2011", "2012", "2013", "2014"],
      team: ["2010": "Matematici",
             "2011": "Matematici",
             "2012": "Matematici",
             "2013": "Matematici",
             "2014": "Matematici"],
      play_time: 305,
      goals_made: 434,
      goals_taken: 328,
      coleader: {
        name: "Giulio Bresciani",
        id: "2"
      },
      partners: [{
        name: "Giulio Bresciani",
        id: "2",
        play_time: 88
      }],
      adversaries: [{
        name: "Giulio Bresciani",
        id: "2",
        play_time: 88
      }]
    }
*/
    $http.post("player", {id: $scope.$stateParams.id, year: $scope.$stateParams.year})
      .success(function(data, status, headers, config) {
        for(var d in data)
          $scope.player[d] = data[d];
      })
      .error(function(data, status, headers, config) {
        console.log("Error!");
      })
  })
