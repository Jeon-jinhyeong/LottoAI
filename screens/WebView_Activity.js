import React, {Component, useState, useEffect} from 'react';
import { Alert, Linking, StyleSheet, Text, View, AppRegistry, BackHandler, ToastAndroid, YellowBox } from 'react-native';
import { WebView } from 'react-native-webview';
import utf8 from 'utf8';
import base64 from 'base-64';
import CookieManager from 'react-native-cookies';
import { Buffer } from 'buffer';
import { createAppContainer } from 'react-navigation';

import AsyncStorage from '@react-native-community/async-storage';
import RNBootSplash from 'react-native-bootsplash'
import OneSignal from 'react-native-onesignal'
import SendIntentAndroid from 'react-native-send-intent'

import { InterstitialAd, AdEventType, TestIds } from '@react-native-firebase/admob';

import RNIap, {
  InAppPurchase,
  PurchaseError,
  SubscriptionPurchase,
  acknowledgePurchaseAndroid,
  consumePurchaseAndroid,
  finishTransaction,
  finishTransactionIOS,
  purchaseErrorListener,
  purchaseUpdatedListener,
  } from 'react-native-iap';

// var text = utf8.encode("m_id=1241927064")
// // let login_web = base64.encode("m_id=" + text)
// let login_web = new Buffer(text).toString('base64');

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8640206644623436/7250350542';

const itemSkus = Platform.select({
  ios: [
      'com.Lotto-AI.10game',
      'com.Lotto-AI.10game', // dooboolab
  ],
  android: [
      'android.test.purchased',
      // 'android.test.canceled',
      // 'android.test.refunded',
      // 'android.test.item_unavailable',
      // 'point_1000', '5000_point', // dooboolab
      '10game',
  ],
});

const itemSubs = Platform.select({
  ios: [
      'com.cooni.point1000',
      'com.cooni.point5000', // dooboolab
  ],
  android: [
      '10game', // subscription
  ],
});

let purchaseUpdateSubscription;
let purchaseErrorSubscription;

export default class WebView_Activity extends Component {
  
  constructor(props){
    super(props);

    this.state = {
      asd: '',
      loaded: false,
      setLoaded: false,
      productList: [],
      receipt: '',
      availableItemsMessage: '',

    };
    OneSignal.init("59f6d43d-7191-49a2-844e-fb729d625e5b");

    OneSignal.addEventListener('received', this.onReceived);
    OneSignal.addEventListener('opened', this.onOpened);
    OneSignal.addEventListener('ids', this.onIds);
  }

  onReceived(notification) {
    console.log("Notification received: ", notification);
  }

  onOpened(openResult) {
    console.log('Message: ', openResult.notification.payload.body);
    console.log('Data: ', openResult.notification.payload.additionalData);
    console.log('isActive: ', openResult.notification.isAppInFocus);
    console.log('openResult: ', openResult);
  }

  onIds(device) {
    console.log('Device info: ', device);
  }

  showInterstitialAd = () => {
    // Create a new instance
    // const interstitialAd = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);
    const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-4577801432842517/8464621950';

    const interstitialAd = InterstitialAd.createForAdRequest(adUnitId);
    // Add event handlers
    interstitialAd.onAdEvent((type, error) => {
        if (type === AdEventType.LOADED) {
            interstitialAd.show();
        }
    });

    // Load a new advert
    interstitialAd.load();
  }

  webView = {
    canGoBack: false,
    ref: null,
  }

  onAndroidBackPress = () => {
    if (this.webView.canGoBack && this.webView.ref) {
      this.webView.ref.goBack();
      return true;
    } else {
       BackHandler.exitApp();  // 앱 종료
       return false;
    }
  }

  goNext = () => {
    Alert.alert('Receipt', this.state.receipt);
  };

  getItems = async () => {
      try {
        const products = await RNIap.getProducts(itemSkus);
        // const products = await RNIap.getSubscriptions(itemSkus);
        console.log('Products', products);
        this.setState({ productList: products });
      } catch (err) {
        console.warn(err.code, err.message);
      }
  };

  getSubscriptions = async () => {
      try {
        const products = await RNIap.getSubscriptions(itemSubs);
        console.log('Products', products);
        this.setState({ productList: products });
      } catch (err) {
        console.warn(err.code, err.message);
      }
  };

  getAvailablePurchases = async () => {
      try {
        console.info(
            'Get available purchases (non-consumable or unconsumed consumable)',
        );
        const purchases = await RNIap.getAvailablePurchases();
        console.info('Available purchases :: ', purchases);
        if (purchases && purchases.length > 0) {
            this.setState({
              availableItemsMessage: `Got ${purchases.length} items.`,
              receipt: purchases[0].transactionReceipt,
            });
        }
      } catch (err) {
        console.warn(err.code, err.message);
        Alert.alert(err.message);
      }
  };

  // Version 3 apis
  requestPurchase = async (sku) => {
      try {
        RNIap.requestPurchase(sku);
      } catch (err) {
        console.warn(err.code, err.message);
      }
  };

  requestSubscription = async (sku) => {
      try {
        RNIap.requestSubscription(sku);
      } catch (err) {
        Alert.alert(err.message);
      }
  };

  componentDidMount() {

    try {
      const result = await RNIap.initConnection();
      await RNIap.consumeAllItemsAndroid();
      console.log('result', result);
    } catch (err) {
        console.warn(err.code, err.message);
    }

    purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase) => {
            const receipt = purchase.transactionReceipt;
            if (receipt) {
                try {
                    // if (Platform.OS === 'ios') {
                    //   finishTransactionIOS(purchase.transactionId);
                    // } else if (Platform.OS === 'android') {
                    //   // If consumable (can be purchased again)
                    //   consumePurchaseAndroid(purchase.purchaseToken);
                    //   // If not consumable
                    //   acknowledgePurchaseAndroid(purchase.purchaseToken);
                    // }
                    const ackResult = await finishTransaction(purchase);
                } catch (ackErr) {
                    console.warn('ackErr', ackErr);
                }

                this.setState({ receipt }, () => this.goNext());
            }
        },
    );

    purchaseErrorSubscription = purchaseErrorListener(
        (error) => {
            console.log('purchaseErrorListener', error);
            Alert.alert('purchase error', JSON.stringify(error));
        },
    );

    //this.showInterstitialAd();
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.onAndroidBackPress);
    }

    // const unitId = 'ca-app-pub-8640206644623436/7250350542';
    // const advert = firebase.admob().interstitial(unitId);
    // const AdRequest = firebase.admob.AdRequest;
    // const request = new AdRequest();
    // // request.addKeyword('foo').addKeyword('bar');
    // advert.loadAd(request.build());

    // advert.on('onAdLoaded', () => {
    //   console.log('Advert ready to show.');
    // });

    // setTimeout(() => {
    //   if (advert.isLoaded()) {
    //     advert.show();
    //   } else {
    //     // Unable to show interstitial - not loaded yet.
    //   }
    // }, 1000);

    // BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
  }

  // 이벤트 해제
  componentWillUnmount() {
      // this.exitApp = false;
      // BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
      OneSignal.removeEventListener('received', this.onReceived);
      OneSignal.removeEventListener('opened', this.onOpened);
      OneSignal.removeEventListener('ids', this.onIds);

      if (Platform.OS === 'android') {
        BackHandler.removeEventListener('hardwareBackPress', this.onAndroidBackPress);
      }

      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
        purchaseUpdateSubscription = null;
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
        purchaseErrorSubscription = null;
      }
  }

  // 이벤트 동작
  // handleBackButton = () => {
  //   // 2000(2초) 안에 back 버튼을 한번 더 클릭 할 경우 앱 종료
  //   if (this.exitApp == undefined || !this.exitApp) {
  //       ToastAndroid.show('한번 더 누르시면 종료됩니다.', ToastAndroid.SHORT);
  //       this.exitApp = true;

  //       this.timeout = setTimeout(
  //           () => {
  //               this.exitApp = false;
  //           },
  //           2000    // 2초
  //       );
  //   } else {
  //       clearTimeout(this.timeout);

  //       BackHandler.exitApp();  // 앱 종료
  //   }
  //   return true;
  // }

  render() {
    const { productList, receipt, availableItemsMessage } = this.state;
    const receipt100 = receipt.substring(0, 100);
    const urI = 'http://lotto.difsoft.com/app/index.php?device=mobile'
    const { navigation } = this.props;
    const kakaoID = navigation.getParam('kakaoID', 'NO-User');
    console.log(kakaoID)
    const injectedJavascript = `(function() {
          window.postMessage = function(data) {
        window.ReactNativeWebView.postMessage(data);
      };
    })()`

    // const Banner = firebase.admob.Banner;
    // const AdRequest = firebase.admob.AdRequest;
    // const request = new AdRequest();
    // request.addKeyword('foobar');

    // const unitId = 'ca-app-pub-8640206644623436/6595265495';

    return (
        <WebView
          ref = { webView => {this.webView.ref = webView; }}
	        onNavigationStateChange={(navState) => {
            console.log(navState.url.slice(0,6)) 
            if (navState.url.slice(0,6) == 'intent') {
              // this.webView.ref.stopLoading();
              SendIntentAndroid.openAppWithUri(navState.url);
              // Linking.sendIntent(navState.url);
            } else {
              this.webView.canGoBack = navState.canGoBack;
            }
          }}
          injectedJavaScript={injectedJavascript}
          onMessage={this._onMessage}
          source={{
            uri: urI,
            method: 'POST',
            body: `${kakaoID}`,

          }}
          bounces={false}
          allowFileAccess={true}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          geolocationEnabled={true}
          saveFormDataDisabled={true}
          allowFileAccessFromFileURLS={true}
          allowUniversalAccessFromFileURLs={true}
          originWhitelist = {'http://*', 'https://*', 'intent://*', "sms://*", "file://*"}
	        cacheEnabled={false}
	        ignoreSslError={true}
          javaScriptEnabled={true}
          useWebKit={true}
          onLoadEnd= {() => {
            console.log('LOAD END!!');
          }}
          onError = {(err) => {
            console.log('ERROR', err);
          }}
        />
        /* <Banner
          unitId={unitId}
          size={'LARGE_BANNER'}
          request={request.build()}
          onAdLoaded={() => {
            console.log('Advert loaded');
          }}
        /> */
    );
  }

  _onMessage = (e) => {
    console.log("asd")
    Alert.alert(e.nativeEvent.data)
    console.log(e.nativeEvent.data)
    this.webView.ref.postMessage("리액트에서 보내는 메세지입니다.")
  }
}

YellowBox.ignoreWarnings(['source.uri']);
