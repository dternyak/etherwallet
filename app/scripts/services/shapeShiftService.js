'use strict';

let softMinCapETH = 0.0001;
let softMinCapBTC = 0.00001;

let shapeShiftAPI = 'https://shapeshift.io';

var shapeShiftService = function($http) {
  return {
    // Status: No Deposits Received
    // {
    //   status:"no_deposits",
    //   address:[address]           //matches address submitted
    // }
    //
    // Status: Received (we see a new deposit but have not finished processing it)
    // {
    //   status:"received",
    //   address:[address]           //matches address submitted
    // }
    //
    // Status: Complete
    // {
    //   status : "complete",
    //   address: [address],
    //   withdraw: [withdrawal address],
    //   incomingCoin: [amount deposited],
    //   incomingType: [coin type of deposit],
    //   outgoingCoin: [amount sent to withdrawal address],
    //   outgoingType: [coin type of withdrawal],
    //   transaction: [transaction id of coin sent to withdrawal address]
    // }
    //
    // Status: Failed
    // {
    //   status : "failed",
    //   error: [Text describing failure]
    // }
    checkStatus: function(address) {
      return $http
        .get(`${shapeShiftAPI}/txStat/${address}`)
        .then(function(resp) {
          return resp.data;
        })
        .catch(function(err) {
          err.error = true;
          return err;
        });
    },

    // pair: [pair],
    // withdrawal: [Withdrawal Address], //-- will match address submitted in post
    // withdrawalAmount: [Withdrawal Amount], // Amount of the output coin you will receive
    // deposit: [Deposit Address (or memo field if input coin is BTS / BITUSD)],
    // depositAmount: [Deposit Amount], // Exact amount of input coin to send in
    // expiration: [timestamp when this will expire],
    // quotedRate: [the exchange rate to be honored]
    // apiPubKey: [public API attached to this shift, if one was given]
    sendAmount: function(withdrawal, originKind, destinationKind, destinationAmount) {
      let pair = originKind.toLowerCase() + '_' + destinationKind.toLowerCase();
      return $http({
        url: `${shapeShiftAPI}/sendamount`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { withdrawal: withdrawal, pair: pair, amount: destinationAmount }
      }).then(function(resp) {
        return resp.data.success;
      });
    },

    getMarketInfo: function() {
      return $http
        .get(`${shapeShiftAPI}/marketinfo`)
        .then(function(resp) {
          return resp.data;
        })
        .catch(function(err) {
          err.error = true;
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
        .get(`${shapeShiftAPI}/timeremaining/${address}`)
        .then(function(resp) {
          return resp.data;
        })
        .catch(function(err) {
          err.error = true;
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
        .get(`${shapeShiftAPI}/getcoins`)
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
            })
          .catch(function(err) {
            err.error = true;
            return err;
          })
        })
        .catch(function(err) {
          err.error = true;
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
      })
        .catch(function (err) {
          err.error = true;
          return err;
        })
    }
  };
};

module.exports = shapeShiftService;
