'use strict';

let softMinCapETH = 0.001;
let softMinCapBTC = 0.00001;

var shapeShiftService = function($http) {
  return {
    getMarketInfo: function() {
      return $http
        .get(`https://shapeshift.io/marketinfo`)
        .then(function(resp) {
          return resp.data;
        })
        .catch(function(err) {
          console.log(err);
          // TODO: show err notification
          return err;
        });
    },

    getPairRateFromMarketInfo: function(originKind, destinationKind, marketInfo) {
      let pair = originKind.toUpperCase() + '_' + destinationKind.toUpperCase();
      let filteredArray = marketInfo.filter(function(obj) {
        return obj.pair === pair;
      });
      if (filteredArray) {
        let pairData = filteredArray[0];
        if (originKind === 'ETH') {
          if (pairData.min < softMinCapETH) {
            pairData.min = softMinCapETH;
          }
        }
        if (originKind === 'BTC') {
          if (pairData.min < softMinCapBTC) {
            pairData.min = softMinCapBTC;
          }
        }
        return pairData;
      } else
        throw Error(
          `No match found for ${pair}. Please contact support@myetherwallet.com with status code RTE22`
        );
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
          return that
            .attachRatesToCoins(whiteListedAvailableCoins)
            .then(function(coinDataWithRates) {
              return coinDataWithRates;
            });
          // TODO - catch errors;
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

    attachRateToCoin: function(coinsObj, coinSymbol, originKind, marketInfo) {
      let destinationKind = coinsObj[coinSymbol].symbol;
      let pairRate = this.getPairRateFromMarketInfo(originKind, destinationKind, marketInfo);
      if (!coinsObj[coinSymbol]['RATES']) {
        coinsObj[coinSymbol]['RATES'] = {};
      }
      coinsObj[coinSymbol]['RATES'][originKind] = pairRate;
    },

    attachRatesToCoins: function(coinsObj, originKindArray) {
      if (!originKindArray) {
        originKindArray = ['BTC', 'ETH'];
      }
      let that = this;
      return this.getMarketInfo().then(function(marketInfo) {
        Object.keys(coinsObj).forEach(function(coinSymbol) {
          originKindArray.forEach(function(originKind) {
            that.attachRateToCoin(coinsObj, coinSymbol, originKind, marketInfo);
          });
        });
        return coinsObj;
      });
      // TODO - catch errors
    }
  };
};

module.exports = shapeShiftService;
