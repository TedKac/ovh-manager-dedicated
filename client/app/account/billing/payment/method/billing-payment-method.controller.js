import angular from 'angular';

import editModalTemplate from './edit/billing-payment-method-edit.html';
import editModalController from './edit/billing-payment-method-edit.controller';

import defaultModalTemplate from './default/billing-payment-method-default.html';
import defaultModalController from './default/billing-payment-method-default.controller';

export default class BillingPaymentMethodCtrl {
  /* @ngInject */

  constructor($q, $translate, $uibModal, Alerter, deletePaymentMethodResolve,
    ovhPaymentMethod, paymentMethodListResolve, User) {
    // dependencies injections
    this.$q = $q;
    this.$translate = $translate;
    this.$uibModal = $uibModal;
    this.Alerter = Alerter;
    this.deletePaymentMethodResolve = deletePaymentMethodResolve;
    this.ovhPaymentMethod = ovhPaymentMethod;
    this.paymentMethodListResolve = paymentMethodListResolve;
    this.User = User;

    // other attributes used in views
    this.loading = {
      init: false,
    };

    this.paymentMethods = null;
    this.tableFilterOptions = null;
    this.guide = null;
    this.hasPendingValidationBankAccount = false;
  }

  /* =============================
  =            EVENTS            =
  ============================== */

  /**
   *  Open edit payment method modal
   */
  onPaymentMethodEditBtnClick(paymentMethodParam) {
    const paymentMethod = paymentMethodParam;

    const editModal = this.$uibModal.open({
      template: editModalTemplate,
      controller: editModalController,
      controllerAs: '$ctrl',
      resolve: {
        paymentMethodToEdit: paymentMethod,
      },
    });

    return editModal.result.then((data) => {
      if (!angular.isObject(data)) {
        return null;
      }

      paymentMethod.description = data.description;

      this.Alerter.success(
        this.$translate.instant('billing_payment_method_edit_success'),
        'billing_payment_method_alert',
      );

      return data;
    }).catch((error) => {
      if (angular.isString(error)) {
        return null;
      }

      this.Alerter.error([
        this.$translate.instant('billing_payment_method_edit_error'),
        _.get(error, 'data.message', ''),
      ].join(' '), 'billing_payment_method_alert');

      return error;
    });
  }

  /**
   *  Open confirmation modal to set payment mean as default one
   */
  onSetDefaultPaymentMethodBtnClick(paymentMethod) {
    const modal = this.$uibModal.open({
      template: defaultModalTemplate,
      controller: defaultModalController,
      controllerAs: '$ctrl',
      resolve: {
        paymentMethodToEdit: paymentMethod,
      },
    });

    return modal.result.then((status) => {
      if (status !== 'OK') {
        return null;
      }

      this.paymentMethods.forEach((methodParam) => {
        const method = methodParam;

        if (method.paymentMethodId === paymentMethod.paymentMethodId) {
          method.default = true;
        } else {
          method.default = false;
        }
      });

      this.Alerter.success(
        this.$translate.instant('billing_payment_method_default_success'),
        'billing_payment_method_alert',
      );

      return paymentMethod;
    }).catch((error) => {
      if (angular.isString(error)) {
        return null;
      }

      this.Alerter.error([
        this.$translate.instant('billing_payment_method_default_error'),
        _.get(error, 'data.message', ''),
      ].join(' '), 'billing_payment_method_alert');

      return error;
    });
  }

  /**
   *  Open delete confirmation modal
   */
  onPaymentMethodDeleteBtnClick(paymentMethod) {
    return this.getDeleteModalTemplate()
      .then(({ template, controller }) => {
        const deleteModal = this.$uibModal.open({
          template,
          controller,
          controllerAs: '$ctrl',
          resolve: {
            paymentMethodToDelete: paymentMethod,
          },
        });

        return deleteModal.result;
      })
      .then((status) => {
        if (status !== 'OK') {
          return null;
        }

        _.remove(this.paymentMethods, paymentMethod);

        this.Alerter.success(
          this.$translate.instant('billing_payment_method_delete_success'),
          'billing_payment_method_alert',
        );

        return paymentMethod;
      }).catch((error) => {
        if (angular.isString(error)) {
          return null;
        }

        this.Alerter.error([
          this.$translate.instant('billing_payment_method_delete_error'),
          _.get(error, 'data.message', ''),
        ].join(' '), 'billing_payment_method_alert');

        return error;
      });
  }

  /* -----  End of EVENTS  ------ */

  getDeleteModalTemplate() {
    return this.$q.all(this.deletePaymentMethodResolve)
      .then(({ template, controller }) => ({
        template: template.default,
        controller: controller.default,
      }));
  }

  /* =====================================
  =            INITIALIZATION            =
  ====================================== */

  $onInit() {
    this.loading.init = true;

    return this.$q.all({
      paymentMethods: this.paymentMethodListResolve.promise,
      guides: this.User.getUrlOf('guides'),
    }).then(({ paymentMethods, guides }) => {
      this.paymentMethods = paymentMethods;
      // set options for status filter
      this.tableFilterOptions = {
        status: {
          values: {},
        },
        type: {
          values: {},
        },
      };

      _.chain(this.paymentMethods).uniq('status.value').map('status').value()
        .forEach((status) => {
          _.set(this.tableFilterOptions.status.values, status.value, status.text);
        });

      _.chain(this.paymentMethods).uniq('paymentType.value').map('paymentType').value()
        .forEach((paymentType) => {
          _.set(this.tableFilterOptions.type.values, paymentType.value, paymentType.text);
        });

      // set guide url
      this.guide = _.get(guides, 'autoRenew', null);

      // set a awrn message if a bankAccount is in pendingValidation state
      this.hasPendingValidationBankAccount = _.some(this.paymentMethods, method => method.paymentType.value === 'bankAccount' && method.status.value === 'pendingValidation');

      return this.getDeleteModalTemplate();
    }).catch((error) => {
      console.log(error);
      this.Alerter.error([
        this.$translate.instant('billing_payment_method_load_error'),
        _.get(error, 'data.message', ''),
      ].join(' '), 'billing_payment_method_alert');
    }).finally(() => {
      this.loading.init = false;
    });
  }

  /* -----  End of INITIALIZATION  ------ */
}

angular
  .module('Billing')
  .controller('BillingPaymentMethodCtrl', BillingPaymentMethodCtrl);
