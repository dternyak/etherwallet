'use strict';

var shapeShiftService = function($http) {
  return {
    getPairRate: function(originSymbol, destinationSymbol) {
      let pair =
        originSymbol.toLowerCase() + '_' + destinationSymbol.toLowerCase();
      return $http
        .get(`https://shapeshift.io/rate/${pair}`)
        .then(function(resp) {
          return resp.data;
        })
        .catch(function(err) {
          console.log(err);
          // TODO: show err notification
          return err;
        });
    },

    getTimeRemaining: function(address) {
      return $http
        .get(`https://shapeshift.io/timeremaining/${address}`)
        .then(function(resp) {
          return resp.data;
        })
        .catch(function(err) {
          console.log(err);
          // TODO: show err notification
          return err;
        });
    },

    onlyAvailableCoins: function(coinsObj) {
      let coinObjCopy = angular.copy(coinsObj);
      Object.keys(coinObjCopy).forEach(function(key) {
        if (!(coinObjCopy[key].status === 'available')) {
          delete coinObjCopy[key];
        }
      });
      return coinObjCopy;
    },

    getAvailableCoins: function(whiteListSymbolArray) {
      let that = this;
      return $http
        .get('https://shapeshift.io/getcoins')
        .then(function(resp) {
          let availableCoins = that.onlyAvailableCoins(resp.data);
          let whiteListedAvailableCoins = that.getWhiteListedCoins(
            availableCoins,
            whiteListSymbolArray
          );
          return that.attachRatesToCoins(whiteListedAvailableCoins);
        })
        .catch(function(err) {
          console.log(err);
          // TODO: show err notification
          return err;
        });
    },

    getWhiteListedCoins: function(coinsObj, whiteListSymbolArray) {
      let filteredObj = {};
      whiteListSymbolArray.forEach(function(each) {
        filteredObj[each] = coinsObj[each];
      });
      return filteredObj;
    },

    attachRatesToCoins: function(coinsObj, originKindArray) {
      if (!originKindArray) {
        originKindArray = ['BTC', 'ETH'];
      }
      let that = this;
      Object.keys(coinsObj).forEach(function(key) {
        originKindArray.forEach(function(originKind) {
          coinsObj[key]['RATES'] = {};
          that
            .getPairRate(originKind, coinsObj[key].symbol)
            .then(function(pairRate) {
              coinsObj[key]['RATES'][originKind] = pairRate;
            });
        });
      });
      return coinsObj;
    }
  };
};
module.exports = shapeShiftService;
