import angular from 'angular';
import translate from 'angular-translate';
import translateAsyncLoader from '@ovh-ux/translate-async-loader';

/* eslint-disable import/no-webpack-loader-syntax, import/no-unresolved, import/extensions */
import 'script-loader!@ovh-ux/ovh-utils-angular/bin/ovh-utils-angular.min.js';
import 'script-loader!@ovh-ux/ovh-utils-angular/lib/core.js';
import 'script-loader!df-tab-menu/build/df-tab-menu.min.js';
/* eslint-enable import/no-webpack-loader-syntax, import/no-unresolved, import/extensions */

import ducOvhTabsDirective from './tabs.directive';

const moduleName = 'ducTabs';

angular
  .module(moduleName, [
    'digitalfondue.dftabmenu',
    'ovh-utils-angular',
    translate,
    translateAsyncLoader,
  ])
  .directive('ducOvhTabs', ducOvhTabsDirective)
  .run(/* @ngTranslationsInject ./translations */);

export default moduleName;
