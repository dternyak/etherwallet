<article class="swap-order" ng-show="showStage3ShapeShift">


    <!-- Title -->
    <section class="row text-center">
        <div class="col-xs-3 text-left"><a class="btn btn-danger btn-xs" ng-click="newSwap()"> Start New Swap </a></div>
        <h5 class="col-xs-6" translate="SWAP_information">Your Information</h5>
        <div class="col-xs-3">
            <a class="link bity-logo" href="https://shapeshift.io" target="_blank" rel="noopener noreferrer">
                <img class="pull-right" src="images/ShapeShiftDark.png" width="100" height="38"/>
            </a></div>
    </section>


    <!-- Order Info -->
    <section class="row order-info-wrap">
        <div class="col-sm-3 order-info">
            <h4>{{orderResult.orderId}}</h4>
            <p translate="SWAP_ref_num">Your reference number</p>
        </div>
        <div class="col-sm-3 order-info">
            <h4>{{orderResult.expirationFormatted}}</h4>
            <p ng-show="orderResult.expirationFormatted" translate="SWAP_time">Time remaining to send</p>
        </div>
        <div class="col-sm-3 order-info">
            <h4>{{orderResult.withdrawalAmount}} {{orderResult.pair.split('_')[1].toUpperCase()}}</h4>
            <p translate="SWAP_rec_amt">Amount to receive</p>
        </div>
        <div class="col-sm-3 order-info">
            <h4>{{swapOrder.swapRate}} {{swapOrder.swapPair}}</h4>
            <p translate="SWAP_your_rate">Your rate</p>
        </div>
    </section>


    <!-- Swap Progress -->
    <section class="row swap-progress">
        <div class="sep"></div>
        <div class="progress-item {{orderResult.progress.bar[0]}}">
            <div class="progress-circle"><i>1</i></div>
            <p translate="SWAP_progress_1">Order Initiated</p>
        </div>
        <div class="progress-item {{orderResult.progress.bar[1]}}">
            <div class="progress-circle"><i>2</i></div>
            <p><span translate="SWAP_progress_2">Waiting for your </span> {{orderResult.inputCurrency}}...</p>
        </div>
        <div class="progress-item {{orderResult.progress.bar[2]}}">
            <div class="progress-circle"><i>3</i></div>
            <p>{{orderResult.inputCurrency}} <span translate="SWAP_progress_3">Received!</span></p>
        </div>

        <div class="progress-item {{orderResult.progress.bar[3]}}">
            <div class="progress-circle"><i>4</i></div>
            <p>
                <span translate="SWAP_progress_4">Sending your </span> {{orderResult.outputCurrency}} <br/>
            </p>
            <div ng-if="isBitySwap">
                <small ng-show="orderResult.inputCurrency=='ETH'"> Waiting for 10 confirmations...</small>
                <small ng-show="orderResult.inputCurrency=='BTC'"> Waiting for 1 confirmation...</small>
            </div>
            <div ng-if="!isBitySwap">
                <small> Waiting for confirmations...</small>
            </div>
        </div>

        <div class="progress-item {{orderResult.progress.bar[4]}}">
            <div class="progress-circle"><i>5</i></div>
            <p translate="SWAP_progress_5">Order Complete</p>
        </div>
    </section>


    <!-- Swap CTA -->
    <section class="row text-center" ng-show="orderResult.progress.status=='OPEN'">
        <h1>
            <span translate="SWAP_order_CTA">      Please send                                                 </span>
            <strong> {{orderResult.depositAmount}} {{orderResult.inputCurrency}} </strong>
            <span translate="SENDModal_Content_2"> to address                                                  </span><br/>
            <strong class="mono text-primary"> {{orderResult.payment_address}} </strong>
        </h1>
    </section>


    <!-- Swap CTA ETH -->
    <article class="row" ng-show="showStage3Eth">
        <section class="clearfix collapse-container">
            <div class="text-center" ng-click="wd = !wd">
                <a class="collapse-button"><span ng-show="wd">+</span><span ng-show="!wd">-</span></a>
                <h5 traslate="SWAP_unlock">Unlock your wallet to send ETH or Tokens directly from this page.</h5>
            </div>
            <div ng-show="!wd">
                @@if (site === 'mew' ) {
                <wallet-decrypt-drtv></wallet-decrypt-drtv>
                }
                @@if (site === 'cx' ) {
                <cx-wallet-decrypt-drtv></cx-wallet-decrypt-drtv>
                }
            </div>
        </section>

        <div class="alert alert-danger" ng-show="ajaxReq.type!=='ETH'">
            <strong>Warning! You are not connected to an ETH node.</strong> <br/>
            Please use the node switcher in the top-right corner to switch to an ETH node. We <strong>do not</strong>
            support swapping ETC or Testnet ETH.
        </div>

        <section class="row" ng-show="wallet!=null" ng-controller='sendTxCtrl'>
            @@if (site === 'mew' ) { @@include( './sendTx-content.tpl', { "site": "mew" } ) }
            @@if (site === 'cx' ) { @@include( './sendTx-content.tpl', { "site": "cx" } ) }

            @@if (site === 'mew' ) { @@include( './sendTx-modal.tpl', { "site": "mew" } ) }
            @@if (site === 'cx' ) { @@include( './sendTx-modal.tpl', { "site": "cx" } ) }
        </section>
    </article>
    <!-- / Swap CTA ETH -->


    <!-- Swap CTA BTC -->
    <section class="row block swap-address text-center" ng-show="showStage3Btc">
        <label translate="x_Address"> Your Address </label>
        <div class="qr-code" qr-code="{{'bitcoin:'+orderResult.payment_address+'?amount='+orderResult.input.amount}}"
             watch-var="orderResult"></div>
        <br/>
        <p class="text-danger">
            Orders that take too long will have to be processed manually &amp; and may delay the amount of time it takes
            to receive your coins.
            <br/>
            <a href="https://shapeshift.io/#/btcfee" target="_blank" rel="noopener noreferrer">Please use the
                recommended TX fees seen here.</a>
        </p>

    </section>


</article>
