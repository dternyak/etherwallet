<!-- Swap Rates Panel -->
<article class="swap-rates" ng-show="showStage1">

    <!-- Title -->
    <section class="row">
        <h5 class="col-xs-6 col-xs-offset-3" translate="SWAP_rates"> Current Rates </h5>
    </section>
    <!-- Title -->

    <!-- Colored Columns -->
    <section class="row order-panel">

        <div ng-if="isBitySwap">
            <div class="col-sm-6 order-info">
                <p class="mono">
                    <input class="form-control input-sm" ng-model="priceTicker.ETHBTC"/>
                    <span>ETH = {{bity.curRate.ETHBTC*priceTicker.ETHBTC | number: 6}} BTC</span>
                </p>
                <p class="mono">
                    <input class="form-control input-sm" ng-model="priceTicker.ETHREP"/>
                    <span>ETH = {{bity.curRate.ETHREP*priceTicker.ETHREP | number: 6}} REP</span>
                </p>
            </div>
            <div class="col-sm-6 order-info">
                <p class="mono">
                    <input class="form-control input-sm" ng-model="priceTicker.BTCETH"/>
                    <span>BTC = {{bity.curRate.BTCETH*priceTicker.BTCETH | number: 6}} ETH</span>
                </p>
                <p class="mono">
                    <input class="form-control input-sm" ng-model="priceTicker.BTCREP"/>
                    <span>BTC = {{bity.curRate.BTCREP*priceTicker.BTCREP | number: 6}} REP</span>
                </p>
            </div>
        </div>

        <div ng-if="!isBitySwap">
            <div class="col-sm-6 order-info">
                <p class="mono">
                    <input class="form-control input-sm" value="1" disabled="true"/>
                    <span>ETH = {{shapeShiftCoinData['ETC']['RATES']['ETH'].rate}} ETC</span>
                </p>
                <p class="mono">
                    <input class="form-control input-sm" value="1" disabled="true"/>
                    <span>ETH = {{shapeShiftCoinData['SNT']['RATES']['ETH'].rate}} SNT</span>
                </p>
            </div>
            <div class="col-sm-6 order-info">
                <p class="mono">
                    <input class="form-control input-sm" value="1" disabled="true"/>
                    <span>ETH = {{shapeShiftCoinData['GNT']['RATES']['ETH'].rate}} GNT</span>
                </p>
                <p class="mono">
                    <input class="form-control input-sm" value="1" disabled="true"/>
                    <span>ETH = {{shapeShiftCoinData['REP']['RATES']['ETH'].rate}} REP</span>
                </p>
            </div>
        </div>


        <div ng-if="isBitySwap">
            <a class="link bity-logo" href="https://bity.com/af/jshkb37v" target="_blank" rel="noopener">
                <img src="images/logo-bity-white.svg" width="120" height="49"/></a>
        </div>
        <div ng-if="!isBitySwap">
            <a class="link bity-logo" href="https://shapeshift.io" target="_blank" rel="noopener">
                <img src="images/ShapeShift.png" width="120" height="49"/></a>
        </div>
    </section>
    <!-- / Colored Columns -->
</article>
<!-- / Swap Rates Panel -->


<!-- Swap Init Panel -->
<article class="swap-panel block clearfix" ng-show="showStage1">
    <h1 translate="SWAP_init_1"> I want to swap my </h1>
    <br/>

    <div ng-if="canShowSwap" class="swap-panel-input-container" style="">
        <div class="spacer"></div>
        <div class="swap-panel-input">
            <p style="color: red; margin-top: -23px; margin-bottom: 0px;" ng-if="originRateError">{{originRateError}}</p>
            <input id="origin"
                   class="form-control"
                   style="display: inline-block;"
                   type="text"
                   placeholder="{{ 'SEND_amount_short' | translate }}"
                   ng-change="updateEstimate(true)"
                   ng-model="swapOrder.fromVal"
                   ng-click="showedMinMaxError = false"
                   ng-class="Validator.isPositiveNumber(swapOrder.fromVal)  && verifyMinMaxValues() ? 'is-valid' : 'is-invalid'"/>

            <div class="dropdown" style="display: inline-block;">
                <a class="btn btn-default dropdown-toggle" ng-click="flip('dropdownFrom')">{{swapOrder.fromCoin}}<i
                        class="caret"></i></a>
                <ul class="dropdown-menu dropdown-menu-right" ng-if="dropdownFrom">
                    <li ng-repeat="coin in availableCoins track by $index">
                        <a ng-class="{true:'active'}[coin == swapOrder.fromCoin]" ng-click="setOrderCoin(true, coin)">
                            {{coin}} </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="swap-panel-input-container-text">
            <h1 translate="SWAP_init_2"> for </h1>
        </div>

        <div class="swap-panel-input">
            <p style="margin-left: -75px; color: red; margin-top: -23px" ng-if="destinationRateError">
                {{destinationRateError}}</p>
            <input id="destination"
                   class="form-control"
                   style="display: inline-block;"
                   type="text"
                   placeholder="{{ 'SEND_amount_short' | translate }}"
                   ng-change="updateEstimate(false)"
                   ng-model="swapOrder.toVal"
                   ng-click="showedMinMaxError = false"
                   ng-class="Validator.isPositiveNumber(swapOrder.toVal) && verifyMinMaxValues() ? 'is-valid' : 'is-invalid'"/>

            <div class="dropdown" style="display: inline-block;">
                <a class="btn btn-default dropdown-toggle" ng-click="flip('dropdownTo')">{{swapOrder.toCoin}}<i
                        class="caret"></i></a>
                <ul class="dropdown-menu dropdown-menu-right" ng-show="dropdownTo">
                    <li ng-repeat="coin in allAvailableDestinationCoins track by $index"
                        ng-show="coin != swapOrder.fromCoin">
                        <a ng-class="{true:'active'}[coin == swapOrder.toCoin]" ng-click="setOrderCoin(false, coin)">
                            {{coin}} </a>
                    </li>
                </ul>
            </div>
        </div>
        <div class="spacer"></div>
    </div>

    <div ng-if="!canShowSwap">
        <h3>Loading...</h3>

    </div>

    <div class="col-xs-12 clearfix text-center" style="margin-top: 80px">
        <a ng-click="setFinalPrices()"
           ng-disabled="(originRateError || destinationRateError) || !(Validator.isPositiveNumber(swapOrder.toVal) && verifyMinMaxValues())"
           class="btn btn-info btn-primary">
            <span translate="SWAP_init_CTA"> Let's do this! </span>
        </a>
    </div>

</article>
<!-- / Swap Init Panel -->
