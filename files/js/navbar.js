'use strict';

angular.module('24ore.navbar', ['24ore.score'])
  .directive('navbar', function() {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'files/partials/navbar.html',
      replace: true,
      transclude: true,
      controller: 'NavbarCtrl'
    };
  })
  .controller('NavbarCtrl', function($scope, $state, $window, scoreManager) {
    $scope.$state = $state;
    $scope.score = scoreManager;
    $scope.$subpages = {
      "overview": [],
      "stats": [
        ["Statistiche generali", "stats({year: 'all'})"],
        ["2010", "stats({year: 2010})"],
        ["2011", "stats({year: 2011})"],
        ["2012", "stats({year: 2012})"],
        ["2013", "stats({year: 2013})"],
        ["2014", "stats({year: 2014})"],
        ["2015", "stats({year: 2015})"],
        ["2016", "stats({year: 2016})"],
        ["2017", "stats({year: 2017})"],
        ["2018", "stats({year: 2018})"]
      ],
      "trailer": [],
      "24h": [
        ["Punteggio in tempo reale", "score"],
        ["Streaming in tempo reale", "streaming"],
        ["Turni programmati", "schedule"]
      ],
      "event": [
        ["Regolamento", "rules"],
        ["Riconoscimenti", "credits"],
        ["Storia", "annals"]
      ]
    }
    $scope.subpages = function() {
      var pageMap = {
        "stats": "stats",
        "trailer": "trailer",
        "overview": "overview",
        "score": "24h",
        "streaming": "24h",
        "schedule": "24h",
        "rules": "event",
        "credits": "event",
        "annals": "event",
        "player": "stats"
      }
      var page = $state.current.name;
      return $scope.$subpages[pageMap[page]];
    };
  });
