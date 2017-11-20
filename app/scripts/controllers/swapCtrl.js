'use strict';
let swapCtrl = function($scope, shapeShiftService) {
  let lStorageKey = 'swapOrder';
  $scope.isBitySwap = true;
  $scope.ajaxReq = ajaxReq;
  $scope.showedMinMaxError = false;
  $scope.shapeShiftCoinData = null;
  $scope.originRateError = null;
  $scope.destinationRateError = null;
  $scope.loadedBityRates = false;
  $scope.loadedShapeShiftRates = false;
  $scope.Validator = Validator;
  $scope.bity = new bity();
  $scope.priceTicker = {
    ETHBTC: 1,
    ETHREP: 1,
    BTCREP: 1,
    BTCETH: 1,
    REPBTC: 1,
    REPETH: 1
  };
  $scope.allAvailableDestinationCoins = [];
  $scope.availableCoins = ['ETH', 'BTC'];
  $scope.shapeShiftWhitelistCoins = ['ETC', 'ZRX', 'SNT', 'ANT', 'BAT', 'GNT', 'BNT', 'REP'];
  $scope.canShowSwap = false;

  $scope.getNameFromSymbol = function(symbol) {
    if (symbol === 'BTC') {
      return 'Bitcoin';
    } else if (symbol === 'ETH') {
      return 'Ethereum';
    } else {
      return $scope.shapeShiftCoinData[symbol].name;
    }
  };

  $scope.flip = function(val) {
    $scope[val] = !$scope[val];
  };

  let timeOutMessage =
    "Time has run out. If you have already sent, please wait 1 hour. If your order has not be processed after 1 hour, please press the orange 'Issue with your Swap?' button.";

  $scope.bity.refreshRates(function() {
    if (!$scope.showStage3ShapeShift) {
      $scope.loadedBityRates = true;
      $scope.allAvailableDestinationCoins = $scope.allAvailableDestinationCoins.concat(
        $scope.availableCoins
      );
      $scope.setOrderCoin(true, 'ETH');
    }
  });

  let checkCanShowRates = function() {
    if ($scope.loadedShapeShiftRates && $scope.loadedBityRates) {
      $scope.canShowSwap = true;
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    }
  };

  setInterval(function() {
    $scope.bity.refreshRates(function() {
      if (!$scope.loadedBityRates) {
        $scope.allAvailableDestinationCoins = $scope.allAvailableDestinationCoins.concat(
          $scope.availableCoins
        );
        $scope.loadedBityRates = true;
      }
      checkCanShowRates();
    });
  }, 30000);

  $scope.getAvailableShapeShiftCoins = function() {
    shapeShiftService
      .getAvailableCoins($scope.shapeShiftWhitelistCoins)
      .then(function(shapeShiftCoinData) {
        console.log(shapeShiftCoinData);
        $scope.shapeShiftCoinData = shapeShiftCoinData;
        $scope.loadedShapeShiftRates = true;
        $scope.allAvailableDestinationCoins = $scope.allAvailableDestinationCoins.concat(
          $scope.shapeShiftWhitelistCoins
        );
        checkCanShowRates();
      })
      .catch(function(err) {
        $scope.loadedShapeShiftRates = true;
        checkCanShowRates();
        $scope.notifier.danger('ShapeShift swaps are currently unavailable.', 0);
      });
  };

  let swapProvider = function(originKind, destinationKind) {
    let provider;
    if (originKind === 'ETH' && destinationKind === 'BTC') {
      provider = 'BITY';
    } else if (originKind === 'BTC' && destinationKind === 'ETH') {
      provider = 'BITY';
    } else if ((originKind === 'BTC' || originKind === 'ETH') && destinationKind === 'REP') {
      provider = 'BITY';
    } else {
      provider = 'SHAPESHIFT';
    }
    return provider;
  };

  let checkIfBitySwap = function() {
    $scope.isBitySwap = swapProvider($scope.swapOrder.fromCoin, $scope.swapOrder.toCoin) === 'BITY';
  };

  let initValues = function() {
    $scope.showStage1 = true;
    $scope.showStage2 = $scope.showStage3Eth = $scope.showStage3Btc = false;
    $scope.showStage3ShapeShift = false;
    $scope.showStage3Bity = false;
    $scope.orderResult = null;
    $scope.isBitySwap = true;
    $scope.swapOrder = {
      fromCoin: 'ETH',
      toCoin: 'BTC',
      isFrom: true,
      fromVal: '',
      toVal: '',
      toAddress: '',
      swapRate: '',
      swapPair: ''
    };
    $scope.getAvailableShapeShiftCoins();
  };

  function roundNumber(rnum, rlength) {
    return Math.round(rnum * Math.pow(10, rlength)) / Math.pow(10, rlength);
  }

  $scope.verifyMinMaxValuesBity = function() {
    let BTCMinimum = bity.min;
    let BTCMaximum = bity.max;
    if ($scope.swapOrder.fromCoin === 'BTC') {
      if ($scope.swapOrder.fromVal < BTCMinimum) {
        $scope.originRateError = `Minimum BTC amount is ${BTCMinimum}`;
        return false;
      }
      if ($scope.swapOrder.fromVal > BTCMaximum) {
        $scope.originRateError = `Maximum BTC amount is ${BTCMaximum}`;
        return false;
      }
      $scope.originRateError = null;
      $scope.destinationRateError = null;
      return true;
    } else if ($scope.swapOrder.fromCoin === 'ETH') {
      let ETHMinimum = BTCMinimum / $scope.bity.curRate['ETHBTC'];
      let ETHMinimumWithBuffer = ETHMinimum + 0.3 * ETHMinimum;
      let ETHMinimumRounded = roundNumber(ETHMinimumWithBuffer, 3);

      let ETHMaximum = BTCMaximum / $scope.bity.curRate['ETHBTC'];
      let ETHMaximumWithBuffer = ETHMaximum - 0.2 * ETHMinimum;
      let ETHMaximumRounded = roundNumber(ETHMaximumWithBuffer, 3);

      if ($scope.swapOrder.fromVal < ETHMinimumRounded) {
        $scope.originRateError = `Minimum ETH amount is ${ETHMinimumRounded}`;
        return false;
      }
      if ($scope.swapOrder.fromVal > ETHMaximumRounded) {
        $scope.originRateError = `Maximum ETH amount is ${ETHMaximumRounded}`;
        return false;
      }
      $scope.originRateError = null;
      $scope.destinationRateError = null;
      return true;
    }
  };

  $scope.verifyMinMaxValuesShapeShift = function() {
    let shapeShiftPairMarketData =
      $scope.shapeShiftCoinData[$scope.swapOrder.toCoin]['RATES'][$scope.swapOrder.fromCoin];
    let minimum = shapeShiftPairMarketData['min'];
    let maximum = shapeShiftPairMarketData['maxLimit'];
    if ($scope.swapOrder.fromVal < minimum) {
      $scope.originRateError = `Minimum ${$scope.swapOrder.fromCoin} amount is ${minimum}`;
      return false;
    }
    if ($scope.swapOrder.fromVal > maximum) {
      $scope.originRateError = `Maximum ${$scope.swapOrder.fromCoin} amount is ${maximum}`;
      return false;
    }
    $scope.originRateError = null;
    $scope.destinationRateError = null;
    return true;
  };

  let checkInputValuesValidity = function() {
    return (
      $scope.swapOrder.toVal == '' ||
      $scope.swapOrder.fromVal == '' ||
      $scope.swapOrder.toVal == '0' ||
      $scope.swapOrder.fromVal == '0' ||
      $scope.showedMinMaxError
    );
  };

  $scope.verifyMinMaxValues = function() {
    if (checkInputValuesValidity() && (!$scope.showStage3ShapeShift && !$scope.showStage3Bity)) {
      $scope.originRateError = null;
      $scope.destinationRateError = null;
      return false;
    } else {
      if ($scope.isBitySwap) {
        return $scope.verifyMinMaxValuesBity();
      } else {
        return $scope.verifyMinMaxValuesShapeShift();
      }
    }
  };

  $scope.handleMatchingToAndFromCoins = function() {
    for (let i in $scope.availableCoins)
      if ($scope.availableCoins[i] !== $scope.swapOrder.fromCoin) {
        $scope.swapOrder.toCoin = $scope.availableCoins[i];
        break;
      }
  };

  $scope.setOrderCoin = function(isFrom, coin) {
    if ($scope.swapOrder) {
      if (isFrom) {
        $scope.swapOrder.fromCoin = coin;
      } else {
        $scope.swapOrder.toCoin = coin;
      }
      if ($scope.swapOrder.fromCoin === $scope.swapOrder.toCoin) {
        $scope.handleMatchingToAndFromCoins();
      }
      checkIfBitySwap();
      $scope.swapOrder.swapPair = $scope.swapOrder.fromCoin + '/' + $scope.swapOrder.toCoin;
      if ($scope.isBitySwap) {
        $scope.swapOrder.swapRate =
          $scope.bity.curRate[$scope.swapOrder.fromCoin + $scope.swapOrder.toCoin];
      } else {
        $scope.swapOrder.swapRate =
          $scope.shapeShiftCoinData[$scope.swapOrder.toCoin]['RATES'][
            $scope.swapOrder.fromCoin
          ].rate;
      }
      $scope.updateEstimate(isFrom);
      $scope.verifyMinMaxValues();
      $scope.dropdownFrom = false;
      $scope.dropdownTo = false;
    }
  };

  let updateEstimateBity = function(isFrom) {
    let cost;
    if (isFrom) {
      cost =
        $scope.bity.curRate[$scope.swapOrder.fromCoin + $scope.swapOrder.toCoin] *
        $scope.swapOrder.fromVal;
      $scope.swapOrder.toVal = parseFloat(cost.toFixed(bity.decimals));
    } else {
      cost =
        $scope.swapOrder.toVal /
        $scope.bity.curRate[$scope.swapOrder.fromCoin + $scope.swapOrder.toCoin];
      $scope.swapOrder.fromVal = parseFloat(cost.toFixed(bity.decimals));
    }
  };

  let updateEstimateShapeShift = function(isFrom) {
    let cost;
    let rate =
      $scope.shapeShiftCoinData[$scope.swapOrder.toCoin]['RATES'][$scope.swapOrder.fromCoin].rate;
    if (isFrom) {
      cost = rate * $scope.swapOrder.fromVal;
      $scope.swapOrder.toVal = parseFloat(cost.toFixed(bity.decimals));
    } else {
      cost = $scope.swapOrder.toVal / rate;
      $scope.swapOrder.fromVal = parseFloat(cost.toFixed(bity.decimals));
    }
  };

  $scope.updateEstimate = function(isFrom) {
    if ($scope.isBitySwap) {
      updateEstimateBity(isFrom);
    } else {
      updateEstimateShapeShift(isFrom);
    }
    $scope.swapOrder.isFrom = isFrom;
  };

  $scope.setFinalPrices = function() {
    if (
      $scope.originRateError ||
      $scope.destinationRateError ||
      !($scope.Validator.isPositiveNumber($scope.swapOrder.toVal) && $scope.verifyMinMaxValues())
    ) {
      return false;
    }
    $scope.showedMinMaxError = false;
    try {
      if (
        !$scope.Validator.isPositiveNumber($scope.swapOrder.fromVal) ||
        !$scope.Validator.isPositiveNumber($scope.swapOrder.toVal)
      )
        throw globalFuncs.errorMsgs[0];
      if ($scope.verifyMinMaxValues()) {
        $scope.updateEstimate($scope.swapOrder.isFrom);
        $scope.showStage1 = false;
        $scope.showStage2 = true;
      }
    } catch (e) {
      $scope.notifier.danger(e);
    }
  };

  let getProgressBarArr = function(index, len) {
    let tempArr = [];
    for (let i = 0; i < len; i++) {
      if (i < index) tempArr.push('progress-true');
      else if (i == index) tempArr.push('progress-active');
      else tempArr.push('');
    }
    return tempArr;
  };

  let isStorageOrderExists = function() {
    let order = globalFuncs.localStorage.getItem(lStorageKey, null);
    return order && $scope.Validator.isJSON(order);
  };

  let setOrderFromStorage = function() {
    let order = JSON.parse(globalFuncs.localStorage.getItem(lStorageKey, null));
    if (order.provider === 'BITY') {
      $scope.orderResult = order;
      $scope.swapOrder = order.swapOrder;
      processOrderBity();
    } else {
      console.log('is shapeshift');
      console.log(order);
      $scope.swapOrder = order;
      $scope.orderResult = order;
      $scope.showStage2 = false;
      $scope.showStage1 = false;
      $scope.showStage3ShapeShift = true;
      if (order.inputCurrency === 'BTC') {
        $scope.showStage3Eth = false;
        $scope.showStage3Btc = true;
      } else {
        $scope.showStage3Eth = true;
        $scope.showStage3Btc = false;
      }
      $scope.swapOrder.swapPair =
        $scope.swapOrder.inputCurrency + '/' + $scope.swapOrder.outputCurrency;
      $scope.swapOrder.swapRate = $scope.swapOrder.quotedRate;
      processOrderShapeShift();
    }
  };

  let saveOrderToStorage = function(order) {
    globalFuncs.localStorage.setItem(lStorageKey, JSON.stringify(order));
  };

  let makeTransactionNotificationElement = function(url) {
    return "<a href='" + url + "' target='_blank' rel='noopener'> View your transaction </a>";
  };

  let processOrderBity = function() {
    $scope.showStage3Bity = true;
    let orderResult = $scope.orderResult;
    orderResult.progress = {
      status: 'OPEN',
      bar: getProgressBarArr(1, 5),
      showTimeRem: true,
      timeRemaining: '10:00',
      secsRemaining:
        orderResult.validFor -
          parseInt(
            (new Date().getTime() - new Date(orderResult.timestamp_created).getTime()) / 1000
          ),
      pendingStatusReq: false,
      checkDelay: 1000
    };
    let timeRem = setInterval(function() {
      if (!orderResult) clearInterval(timeRem);
      if (orderResult.progress.secsRemaining > 0) {
        if (orderResult.progress.status == 'OPEN') {
          orderResult.progress.secsRemaining--;
        } else {
          orderResult.progress.secsRemaining++;
        }
        let minutes = Math.floor(orderResult.progress.secsRemaining / 60);
        let seconds = orderResult.progress.secsRemaining - minutes * 60;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;
        orderResult.progress.timeRemaining = minutes + ':' + seconds;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      } else {
        orderResult.progress.timeRemaining = '00:00';
        clearInterval(timeRem);
      }
    }, 1000);
    let progressCheck = setInterval(function() {
      if (!orderResult) {
        clearInterval(progressCheck);
      }
      if (!orderResult.progress.pendingStatusReq) {
        orderResult.progress.pendingStatusReq = true;
        $scope.bity.getStatus({ orderid: orderResult.id }, function(data) {
          if (data.error) {
            $scope.notifier.danger(data.msg);
          } else {
            data = data.data;
            if (bity.validStatus.indexOf(data.status) != -1) {
              orderResult.progress.status = 'RCVE';
            }
            if (
              orderResult.progress.status == 'OPEN' &&
              bity.validStatus.indexOf(data.input.status) != -1
            ) {
              orderResult.progress.secsRemaining = 1;
              orderResult.progress.showTimeRem = false;
              orderResult.progress.status = 'RCVE';
              orderResult.progress.bar = getProgressBarArr(3, 5);
            } else if (
              orderResult.progress.status == 'RCVE' &&
              bity.validStatus.indexOf(data.output.status) != -1
            ) {
              orderResult.progress.status = 'FILL';
              orderResult.progress.bar = getProgressBarArr(5, 5);
              orderResult.progress.showTimeRem = false;
              let url = orderResult.output.currency == 'BTC'
                ? bity.btcExplorer.replace('[[txHash]]', data.output.reference)
                : bity.ethExplorer.replace('[[txHash]]', data.output.reference);
              let bExStr = makeTransactionNotificationElement(url);
              $scope.notifier.success(
                globalFuncs.successMsgs[2] + data.output.reference + '<br />' + bExStr
              );
              clearInterval(progressCheck);
              clearInterval(timeRem);
            } else if (bity.invalidStatus.indexOf(data.status) != -1) {
              orderResult.progress.status = 'CANC';
              orderResult.progress.bar = getProgressBarArr(-1, 5);
              $scope.notifier.danger(timeOutMessage);
              orderResult.progress.secsRemaining = 0;
              clearInterval(progressCheck);
            }
            if (!$scope.$$phase) {
              $scope.$apply();
            }
          }
          orderResult.progress.pendingStatusReq = false;
        });
      }
    }, orderResult.progress.checkDelay);
    $scope.showStage2 = false;
    if ($scope.orderResult.input.currency == 'BTC') {
      $scope.showStage3Btc = true;
    } else {
      $scope.parentTxConfig = {
        to: ethUtil.toChecksumAddress($scope.orderResult.payment_address),
        value: $scope.orderResult.input.amount,
        sendMode: $scope.orderResult.input.currency == 'ETH' ? 'ether' : 'token',
        tokensymbol: $scope.orderResult.input.currency == 'ETH'
          ? ''
          : $scope.orderResult.input.currency,
        readOnly: true
      };
      new Modal(document.getElementById('sendTransaction'));
      $scope.showStage3Eth = true;
    }
  };

  let processOrder = function() {
    if ($scope.isBitySwap) {
      processOrderBity();
    } else {
      processOrderShapeShift();
    }
  };

  let isValidAddress = function() {
    return (
      ($scope.swapOrder.toCoin != 'BTC' &&
        $scope.Validator.isValidAddress($scope.swapOrder.toAddress)) ||
      ($scope.swapOrder.toCoin == 'BTC' &&
        $scope.Validator.isValidBTCAddress($scope.swapOrder.toAddress))
    );
  };

  let openOrderBity = function() {
    let order = {
      amount: $scope.swapOrder.isFrom ? $scope.swapOrder.fromVal : $scope.swapOrder.toVal,
      mode: $scope.swapOrder.isFrom ? 0 : 1,
      pair: $scope.swapOrder.fromCoin + $scope.swapOrder.toCoin,
      destAddress: $scope.swapOrder.toAddress
    };
    $scope.bity.openOrder(order, function(data) {
      if (!data.error) {
        $scope.orderResult = data.data;
        $scope.orderResult.swapOrder = $scope.swapOrder;
        $scope.orderResult.provider = 'BITY';
        let orderResult = $scope.orderResult;
        saveOrderToStorage(orderResult);
        processOrder();
        $scope.orderOpenLoading = false;
      } else {
        $scope.notifier.danger(data.msg);
        $scope.orderOpenLoading = false;
      }
      if (!$scope.$$phase) {
        $scope.$apply();
      }
    });
  };

  let formattedTimeRemainingFromEpoch = function(endEpoch) {
    let currentTimeInEpoch = new Date().getTime();
    let remainingTimeMili = endEpoch - currentTimeInEpoch;
    let remainingTimeSec = remainingTimeMili / 1000;
    let remainingTimeSecRounded = roundNumber(remainingTimeSec, 0);
    return formattedTimeFromSeconds(remainingTimeSecRounded);
  };

  let formattedTimeFromSeconds = function(secondsRemaining) {
    if (secondsRemaining <= 0) {
      $scope.notifier.danger(timeOutMessage, 0);
      return '00:00';
    }
    if (secondsRemaining || secondsRemaining === 0) {
      let minutes = Math.floor(secondsRemaining / 60);
      let seconds = secondsRemaining - minutes * 60;
      let stringMinutes = minutes < 10 ? '0' + minutes : minutes;
      let stringSeconds = seconds < 10 ? '0' + seconds : seconds;
      return stringMinutes + ':' + stringSeconds;
    } else {
      throw Error('secondsRemaining must be a number');
    }
  };

  let processOrderShapeShift = function() {
    let timeRem = setInterval(function() {
      if ($scope.showStage3ShapeShift) {
        let expirationFormatted = formattedTimeRemainingFromEpoch($scope.orderResult.expiration);
        if (expirationFormatted === '00:00') {
          $scope.orderIsExpired = true;
          clearInterval(timeRem);
        }
        $scope.orderResult.expirationFormatted = expirationFormatted;
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      } else {
        clearInterval(timeRem);
      }
    }, 1000);
  };

  let openOrderShapeShift = function() {
    shapeShiftService
      .sendAmount(
        $scope.swapOrder.toAddress,
        $scope.swapOrder.fromCoin,
        $scope.swapOrder.toCoin,
        $scope.swapOrder.toVal
      )
      .then(function(orderInfo) {
        $scope.orderOpenLoading = false;
        $scope.showStage2 = false;
        $scope.showStage3ShapeShift = true;
        if ($scope.swapOrder.toCoin === 'BTC') {
          $scope.showStage3Eth = false;
          $scope.showStage3Btc = true;
        } else {
          $scope.showStage3Btc = false;
          $scope.showStage3Eth = true;
        }
        $scope.orderResult = orderInfo;
        $scope.orderResult.provider = 'SHAPESHIFT';
        $scope.orderResult.inputCurrency = orderInfo.pair.split('_')[0].toUpperCase();
        $scope.orderResult.outputCurrency = orderInfo.pair.split('_')[1].toUpperCase();
        saveOrderToStorage($scope.orderResult);
        processOrder();
      })
      .catch(function(err) {
        $scope.orderOpenLoading = false;
      });
  };

  $scope.openOrder = function() {
    if (isValidAddress()) {
      $scope.orderOpenLoading = true;
      if ($scope.isBitySwap) {
        openOrderBity();
      } else {
        openOrderShapeShift();
      }
    } else {
      $scope.notifier.danger(globalFuncs.errorMsgs[5]);
    }
  };

  $scope.newSwap = function() {
    globalFuncs.localStorage.setItem(lStorageKey, '');
    initValues();
  };

  if (isStorageOrderExists()) {
    $scope.showStage1 = false;
    setOrderFromStorage();
  } else {
    initValues();
  }
};

module.exports = swapCtrl;
