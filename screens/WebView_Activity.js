import React, {Component, useState, useEffect} from 'react';
import { Alert, StyleSheet, Text, View, AppRegistry, BackHandler, ToastAndroid, YellowBox } from 'react-native';
import { WebView } from 'react-native-webview';
import utf8 from 'utf8';
import base64 from 'base-64';
import CookieManager from 'react-native-cookies';
import { Buffer } from 'buffer';
import { createAppContainer } from 'react-navigation';

import AsyncStorage from '@react-native-community/async-storage';
import RNBootSplash from 'react-native-bootsplash'
import OneSignal from 'react-native-onesignal'

import { InterstitialAd, AdEventType, TestIds } from '@react-native-firebase/admob';

// var text = utf8.encode("m_id=1241927064")
// // let login_web = base64.encode("m_id=" + text)
// let login_web = new Buffer(text).toString('base64');

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8640206644623436/7250350542';

export default class WebView_Activity extends Component {
  
  constructor(props){
    super(props);

    this.state = {
      asd: '',
      loaded: false,
      setLoaded: false,

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
    const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-8640206644623436/7250350542';

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

  // 이벤트 등록
  componentDidMount() {

    this.showInterstitialAd();

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
    const { navigation } = this.props;
    const kakaoID = navigation.getParam('kakaoID', 'NO-User');

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
          ref = { webview => {this.webview = webview; }}
          injectedJavaScript={injectedJavascript}
          onMessage={this._onMessage}
          source={{
            uri: 'http://dif2.asuscomm.com/app/index.php?device=mobile',
            origin: 'http://dif2.asuscomm.com',
            method: 'POST',
            body: `${kakaoID}`,

          }}
          originWhitelist={['*']}
          javaScriptEnabled={true}
          useWebKit={true}
          onLoadEnd= {() => {
            console.log('LOAD END!!');
          }}
          onError = {err => {
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
    this.webview.postMessage("리액트에서 보내는 메세지입니다.")
  }
}

YellowBox.ignoreWarnings(['source.uri']);