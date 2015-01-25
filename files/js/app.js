'use strict';

angular.module('24ore', ['ui.router', '24ore.box', '24ore.navbar', '24ore.score', '24ore.stats', '24ore.player', 'n3-line-chart'])
  .config(function($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(false);
    $urlRouterProvider
      .when('/stats/', '/stats/all') 
      .otherwise('/overview');
    $stateProvider
      .state('overview', {
        url: '/overview',
        templateUrl: 'files/views/overview.html',
      })
      .state('score', {
        url: '/score',
        templateUrl: 'files/views/score.html',
        controller: 'ScoreCtrl'
      })
      .state('trailers', {
        url: '/trailers',
        templateUrl: 'files/views/trailers.html',
      })
      .state('rules', {
        url: '/rules',
        templateUrl: 'files/views/rules.html',
      })
      .state('annals', {
        url: '/annals',
        templateUrl: 'files/views/annals.html',
      })
      .state('streaming', {
        url: '/streaming',
        templateUrl: 'files/views/streaming.html',
      })
      .state('schedule', {
        url: '/schedule',
        templateUrl: 'files/views/schedule.html',
      })
      .state('stats', {
        url: '/stats/{year}',
        templateUrl: 'files/views/stats.html',
        controller: 'StatsCtrl'
      })
      .state('player', {
        url: '/player/{id}/{year}',
        templateUrl: 'files/views/player.html',
        controller: 'PlayerCtrl'
      })
      .state('credits', {
        url: '/credits',
        templateUrl: 'files/views/credits.html',
      });
  })
  .filter('time', function() {
    return function(time) {
      var hours = Math.floor(time / 60);
      var minutes = Math.floor(time - hours*60);
      var hlabel = hours == 1 ? " ora" : " ore";
      var mlabel = minutes == 1 ? " minuto" : " minuti";
      var ret = "";
      if (hours) ret += hours + hlabel;
      if (minutes) ret += (ret==""?"":", ") + minutes + mlabel;
      return ret;
    }
  })
  .filter('round', function() {
    return function(f, p) {
      return Math.round(f * Math.pow(10, p)) / Math.pow(10, p);
    }
  })
