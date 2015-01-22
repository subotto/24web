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
      "history": [
        ["Statistiche generali", "history"],
        ["Edizione 2010", "history/2010"],
        ["Edizione 2011", "history/2011"],
        ["Edizione 2012", "history/2012"],
        ["Edizione 2013", "history/2013"],
        ["Edizione 2014", "history/2014"]
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
        "history": "history",
        "trailer": "trailer",
        "overview": "overview",
        "score": "24h",
        "streaming": "24h",
        "schedule": "24h",
        "rules": "event",
        "credits": "event",
        "annals": "event"
      }
      var page = $state.current.name;
      return $scope.$subpages[pageMap[page]];
    };
  });
