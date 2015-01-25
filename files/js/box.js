'use strict';

angular.module('24ore.box', [])
  .directive('box', function() {
    return {
      restrict: 'E',
      scope: {
        color: "@",
        title: "@",
        side: "@",
        style: "@"
      },
      templateUrl: "files/partials/box.html",
      transclude: true
    };
   });
