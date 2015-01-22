'use strict';

angular.module('24ore', ['ui.router', '24ore.box', '24ore.navbar', '24ore.score'])
  .config(function($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(false);
    $urlRouterProvider
      .otherwise('/overview');
    $stateProvider
      .state('overview', {
        url: '/overview',
        templateUrl: '/files/views/overview.html',
      })
      .state('score', {
        url: '/score',
        templateUrl: '/files/views/score.html',
        controller: 'ScoreCtrl'
      })
      .state('trailers', {
        url: '/trailers',
        templateUrl: '/files/views/trailers.html',
      })
      .state('rules', {
        url: '/rules',
        templateUrl: '/files/views/rules.html',
      })
      .state('annals', {
        url: '/annals',
        templateUrl: '/files/views/annals.html',
      })
      .state('streaming', {
        url: '/streaming',
        templateUrl: '/files/views/streaming.html',
      })
      .state('schedule', {
        url: '/schedule',
        templateUrl: '/files/views/schedule.html',
      })
      .state('credits', {
        url: '/credits',
        templateUrl: '/files/views/credits.html',
      });
  })
