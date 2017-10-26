'use strict';
var swapCtrl = function($scope, shapeShiftService) {
    var lStorageKey = "swapOrder";
    $scope.isBitySwap = true;
    $scope.ajaxReq = ajaxReq;
    $scope.showedMinMaxError = false;
    $scope.shapeShiftCoinData = null;
    $scope.Validator = Validator;
    $scope.bity = new bity();
    $scope.priceTicker = { ETHBTC: 1, ETHREP: 1, BTCREP: 1, BTCETH: 1, REPBTC: 1, REPETH: 1 };
    $scope.availableCoins = ["ETH", "BTC"];
    $scope.shapeShiftWhitelistCoins = ["ETC", "ZRX", "SNT", "ANT", "BAT", "GNT", "BNT", "REP"];
    $scope.allAvailableDestinationCoins = $scope.availableCoins.concat($scope.shapeShiftWhitelistCoins);
    console.log($scope.allAvailableDestinationCoins);

    $scope.bity.refreshRates(function() {
      $scope.setOrderCoin(true, "ETH");
    });

    setInterval(function() {
      $scope.bity.refreshRates();
    }, 30000);

    $scope.getAvailableShapeShiftCoins = function() {
        shapeShiftService.getAvailableCoins($scope.shapeShiftWhitelistCoins).then(function (data) {
          $scope.shapeShiftCoinData = data;
        })
    };

    $scope.getAvailableShapeShiftCoins();

    $scope.swapProvider = function(originKind, destinationKind) {
      let provider;
      if (originKind === 'ETH' && destinationKind === 'BTC') {
        provider = 'BITY'
      } else if (originKind === 'BTC' && destinationKind === 'ETH') {
        provider = 'BITY'
      } else {
        provider = 'SHAPESHIFT'
      }
      return provider;
    };

    var initValues = function() {
        $scope.showStage1 = true;
        $scope.showStage2 = $scope.showStage3Eth = $scope.showStage3Btc = false;
        $scope.orderResult = null;
        $scope.swapOrder = {
            fromCoin: "ETH",
            toCoin: "BTC",
            isFrom: true,
            fromVal: '',
            toVal: '',
            toAddress: '',
            swapRate: '',
            swapPair: ''
        }
    }
    $scope.verifyMinMaxValues = function() {
        if($scope.swapOrder.toVal=='' || $scope.swapOrder.fromVal == '' || $scope.swapOrder.toVal=='0' || $scope.swapOrder.fromVal == '0' || $scope.showedMinMaxError ) return false;
        var errors = {
            priceNotLoaded: 0,
            lessThanMin: 1,
            greaterThanMax: 2,
            noErrors: 3
        }
        var verify = function() {
            if (!$scope.bity.priceLoaded) return errors.priceNotLoaded;
            else if ($scope.swapOrder.toVal < bity.min || $scope.swapOrder.fromVal < bity.min) return errors.lessThanMin;
            else if (($scope.swapOrder.toCoin == "BTC" && $scope.swapOrder.toVal > bity.max) || ($scope.swapOrder.fromCoin == "BTC" && $scope.swapOrder.fromVal > bity.max)) return errors.greaterThanMax;
            else if (($scope.swapOrder.toCoin == "ETH" && $scope.swapOrder.toVal * $scope.bity.curRate['ETHBTC'] > bity.max) || ($scope.swapOrder.fromCoin == "ETH" && $scope.swapOrder.fromVal * $scope.bity.curRate['ETHBTC'] > bity.max)) return errors.greaterThanMax;
            else if (($scope.swapOrder.toCoin == "REP" && $scope.swapOrder.toVal * $scope.bity.curRate['REPBTC'] > bity.max) || ($scope.swapOrder.fromCoin == "REP" && $scope.swapOrder.fromVal * $scope.bity.curRate['REPBTC'] > bity.max)) return errors.greaterThanMax;
            return errors.noErrors;
        }
        var vResult = verify();
        if (vResult == errors.noErrors) return true;
        else if (vResult == errors.priceNotLoaded) return false;
        else if (vResult == errors.lessThanMin || vResult == errors.greaterThanMax) {
            if (!isStorageOrderExists()) {
              uiFuncs.notifier.danger((globalFuncs.errorMsgs[27] + bity.max + " BTC, " + (bity.max / $scope.bity.curRate['ETHBTC']).toFixed(3) + " ETH, or " + (bity.max / $scope.bity.curRate['REPBTC']).toFixed(3) + " REP"), 2500);
              $scope.showedMinMaxError = true;
            }
            return false;
        }
    };


    $scope.handleMatchingToAndFromCoins = function() {
      for (var i in $scope.availableCoins)
        if ($scope.availableCoins[i] !== $scope.swapOrder.fromCoin) {
          $scope.swapOrder.toCoin = $scope.availableCoins[i];
          break;
        }
    }

    $scope.setOrderCoin = function(isFrom, coin) {
        if (isFrom) {
          $scope.swapOrder.fromCoin = coin
        } else {
          $scope.swapOrder.toCoin = coin
        }

        if ($scope.swapOrder.fromCoin ===  $scope.swapOrder.toCoin) {
          $scope.handleMatchingToAndFromCoins()
        }

        $scope.isBitySwap = $scope.swapProvider($scope.swapOrder.fromCoin, $scope.swapOrder.toCoin) === 'BITY';

      $scope.swapOrder.swapPair = $scope.swapOrder.fromCoin + "/" + $scope.swapOrder.toCoin;

      if ($scope.isBitySwap) {
        $scope.swapOrder.swapRate = $scope.bity.curRate[$scope.swapOrder.fromCoin + $scope.swapOrder.toCoin];
      } else {
        $scope.swapOrder.swapRate = $scope.shapeShiftCoinData[$scope.swapOrder.toCoin]["RATES"][$scope.swapOrder.fromCoin].rate
      }

      $scope.updateEstimate(isFrom);

      $scope.dropdownFrom = $scope.dropdownTo = false;
    };

    $scope.updateEstimate = function(isFrom) {
        var cost;
        // BITY - SET INPUT VALUES
        if ($scope.isBitySwap) {
          if (isFrom) {
            cost = $scope.bity.curRate[$scope.swapOrder.fromCoin + $scope.swapOrder.toCoin] * $scope.swapOrder.fromVal;
            $scope.swapOrder.toVal = parseFloat(cost.toFixed(bity.decimals));
          }
          else {
            cost = $scope.swapOrder.toVal / $scope.bity.curRate[$scope.swapOrder.fromCoin + $scope.swapOrder.toCoin];
            $scope.swapOrder.fromVal = parseFloat(cost.toFixed(bity.decimals));
          }
          // SHAPESHIFT - SET INPUT VALUES
        } else {
          let rate = $scope.shapeShiftCoinData[$scope.swapOrder.toCoin]["RATES"][$scope.swapOrder.fromCoin].rate;
          if (isFrom) {
            cost = rate * $scope.swapOrder.fromVal;
            $scope.swapOrder.toVal = parseFloat(cost) // .toFixed(bity.decimals));
          }
          else {
            cost = $scope.swapOrder.toVal / rate;
            $scope.swapOrder.fromVal = parseFloat(cost) // .toFixed(bity.decimals));
          }

        }
        $scope.swapOrder.isFrom = isFrom;

    };

    $scope.setFinalPrices = function() {
        $scope.showedMinMaxError = false;
        try {

            if (!$scope.Validator.isPositiveNumber($scope.swapOrder.fromVal) || !$scope.Validator.isPositiveNumber($scope.swapOrder.toVal)) throw globalFuncs.errorMsgs[0];
            else if (!$scope.verifyMinMaxValues()) throw globalFuncs.errorMsgs[27];
            $scope.updateEstimate($scope.swapOrder.isFrom);
            $scope.showStage1 = false;
            $scope.showStage2 = true;
        } catch (e) {
            $scope.notifier.danger(e);
        }

    }
    var getProgressBarArr = function(index, len) {
        var tempArr = [];
        for (var i = 0; i < len; i++) {
            if (i < index) tempArr.push('progress-true');
            else if (i == index) tempArr.push('progress-active');
            else tempArr.push('');
        }
        return tempArr;
    }
    var isStorageOrderExists = function() {
        var order = globalFuncs.localStorage.getItem(lStorageKey, null);
        return order && $scope.Validator.isJSON(order);
    }
    var setOrderFromStorage = function() {
        var order = JSON.parse(globalFuncs.localStorage.getItem(lStorageKey, null));
        $scope.orderResult = order;
        $scope.swapOrder = order.swapOrder;
        processOrder();
    }
    var saveOrderToStorage = function(order) {
        globalFuncs.localStorage.setItem(lStorageKey, JSON.stringify(order));
    }
    var processOrder = function() {
        var orderResult = $scope.orderResult;
        orderResult.progress = {
            status: "OPEN",
            bar: getProgressBarArr(1, 5),
            showTimeRem: true,
            timeRemaining: '10:00',
            secsRemaining: orderResult.validFor - parseInt((new Date().getTime() - new Date(orderResult.timestamp_created).getTime()) / 1000),
            pendingStatusReq: false,
            checkDelay: 1000
        };
        var timeRem = setInterval(function() {
            if (!orderResult) clearInterval(timeRem);
            if (orderResult.progress.secsRemaining > 0) {
                if (orderResult.progress.status == "OPEN")
                    orderResult.progress.secsRemaining--;
                else
                    orderResult.progress.secsRemaining++;
                var minutes = Math.floor(orderResult.progress.secsRemaining / 60);
                var seconds = orderResult.progress.secsRemaining - minutes * 60;
                minutes = minutes < 10 ? '0' + minutes : minutes;
                seconds = seconds < 10 ? '0' + seconds : seconds;
                orderResult.progress.timeRemaining = minutes + ':' + seconds;
                if (!$scope.$$phase) $scope.$apply();
            } else {
                orderResult.progress.timeRemaining = "00:00";
                clearInterval(timeRem);
            }
        }, 1000);
        var progressCheck = setInterval(function() {
            if (!orderResult) clearInterval(progressCheck);
            if (!orderResult.progress.pendingStatusReq) {
                orderResult.progress.pendingStatusReq = true;
                $scope.bity.getStatus({ orderid: orderResult.id }, function(data) {
                    if (data.error) $scope.notifier.danger(data.msg);
                    else {
                        data = data.data;
                        if (bity.validStatus.indexOf(data.status) != -1) orderResult.progress.status = "RCVE";
                        if (orderResult.progress.status == "OPEN" && bity.validStatus.indexOf(data.input.status) != -1) {
                            orderResult.progress.secsRemaining = 1;
                            orderResult.progress.showTimeRem = false;
                            orderResult.progress.status = "RCVE";
                            orderResult.progress.bar = getProgressBarArr(3, 5);
                        } else if (orderResult.progress.status == "RCVE" && bity.validStatus.indexOf(data.output.status) != -1) {

                            orderResult.progress.status = "FILL";
                            orderResult.progress.bar = getProgressBarArr(5, 5);
                            orderResult.progress.showTimeRem = false;
                            var url = orderResult.output.currency == 'BTC' ? bity.btcExplorer.replace("[[txHash]]", data.output.reference) : bity.ethExplorer.replace("[[txHash]]", data.output.reference)
                            var bExStr = "<a href='" + url + "' target='_blank' rel='noopener'> View your transaction </a>";
                            $scope.notifier.success(globalFuncs.successMsgs[2] + data.output.reference + "<br />" + bExStr);
                            clearInterval(progressCheck);
                            clearInterval(timeRem);
                        } else if (bity.invalidStatus.indexOf(data.status) != -1) {
                            orderResult.progress.status = "CANC";
                            orderResult.progress.bar = getProgressBarArr(-1, 5);
                            $scope.notifier.danger("Time has run out. If you have already sent, please wait 1 hour. If your order has not be processed after 1 hour, please press the orange 'Issue with your Swap?' button.");
                            orderResult.progress.secsRemaining = 0;
                            clearInterval(progressCheck);
                        }
                        if (!$scope.$$phase) $scope.$apply();
                    }
                    orderResult.progress.pendingStatusReq = false;
                });
            }
        }, orderResult.progress.checkDelay);
        $scope.showStage2 = false;
        if ($scope.orderResult.input.currency == 'BTC') $scope.showStage3Btc = true;
        else {
            $scope.parentTxConfig = {
                to: ethUtil.toChecksumAddress($scope.orderResult.payment_address),
                value: $scope.orderResult.input.amount,
                sendMode: $scope.orderResult.input.currency == 'ETH' ? 'ether' : 'token',
                tokensymbol: $scope.orderResult.input.currency == 'ETH' ? '' : $scope.orderResult.input.currency,
                readOnly: true
            }
            new Modal(document.getElementById('sendTransaction'));
            $scope.showStage3Eth = true;
        }
    }
    $scope.openOrder = function() {

        if (($scope.swapOrder.toCoin != 'BTC' && $scope.Validator.isValidAddress($scope.swapOrder.toAddress)) || ($scope.swapOrder.toCoin == 'BTC' && $scope.Validator.isValidBTCAddress($scope.swapOrder.toAddress))) {
            var order = {
                amount: $scope.swapOrder.isFrom ? $scope.swapOrder.fromVal : $scope.swapOrder.toVal,
                mode: $scope.swapOrder.isFrom ? 0 : 1,
                pair: $scope.swapOrder.fromCoin + $scope.swapOrder.toCoin,
                destAddress: $scope.swapOrder.toAddress
            }
            $scope.bity.openOrder(order, function(data) {
                if (!data.error) {
                    $scope.orderResult = data.data;
                    $scope.orderResult.swapOrder = $scope.swapOrder;
                    var orderResult = $scope.orderResult;
                    saveOrderToStorage(orderResult);
                    processOrder();
                } else $scope.notifier.danger(data.msg);
                if (!$scope.$$phase) $scope.$apply();
            });
        } else {
            $scope.notifier.danger(globalFuncs.errorMsgs[5]);
        }
    }
    $scope.newSwap = function() {
        globalFuncs.localStorage.setItem(lStorageKey, '');
        initValues();
    }
    initValues();
    if (isStorageOrderExists()) {
        $scope.showStage1 = false;
        setOrderFromStorage();
    }
};
module.exports = swapCtrl;
