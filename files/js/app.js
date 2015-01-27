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
        controller: 'overviewCtrl'
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
        controller: 'streamingCtrl'
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
  .controller('overviewCtrl', function($scope) {
    $scope.load_twitter = twttr.widgets.load;
  })
  .controller('streamingCtrl', function($scope) {
    $scope.quality = 'hi';
  })
  .filter('time', function() {
    return function(time) {
      if (time == 0) return "0s";
      var time = Math.floor(time);
      var hours = Math.floor(time / 3600);
      var minutes = Math.floor(time/60 - hours*60);
      var seconds = Math.floor(time - hours*3600 - minutes*60);
      var l1 = "h";
      var v1 = hours;
      var l2 = "m";
      var v2 = minutes;
      if (time < 3600) {
        l1 = "m";
        v1 = minutes;
        l2 = "s";
        v2 = seconds;
      }
      var ret = "";
      if (v1) ret += v1 + l1;
      if (v2) ret += (ret==""?"":" ") + v2 + l2;
      return ret;
    }
  })
  .filter('dtime', function() {
    return function(time) {
      if (time == 0) return "0s";
      var time = Math.floor(time);
      var hours = Math.floor(time / 3600);
      var minutes = Math.floor(time/60 - hours*60);
      var seconds = Math.floor(time - hours*3600 - minutes*60);
      minutes = minutes + "";
      if (minutes.length < 2) minutes = "0" + minutes;
      seconds = seconds + "";
      if (seconds.length < 2) seconds = "0" + seconds;
      return hours + ":" + minutes + ":" + seconds;
    }
  })
  .filter('round', function() {
    return function(f, p) {
      if (f == "Infinity") return "∞";
      return Math.round(f * Math.pow(10, p)) / Math.pow(10, p);
    }
  })
