import React, { Component } from 'react';
import {ImageBackground, Platform, StyleSheet, Text, View, Image, YellowBox, BackHandler, ToastAndroid} from 'react-native';

import AsyncStorage from '@react-native-community/async-storage';
import KakaoLogins from '@react-native-seoul/kakao-login';
import NativeButton from 'apsl-react-native-button';
import base64 from 'base-64';
import utf8 from 'utf8';
import { Buffer } from 'buffer';
import OneSignal from 'react-native-onesignal'



// const logCallback = (log, callback) => {
//   console.log(log);
//   callback;
// };
var text = utf8.encode("1141065712")
// let login_web = base64.encode("m_id=" + text)
let login_web = new Buffer("m_id=1141065712").toString('base64');

export default class Login extends Component {

  constructor(props) {
    super(props);

    this.state = {
        isKakaoLogging: false,
        token: 'token has not fetched',
        id: 'profile has not fetched',
        email: 'profile has not fetched',
        profile_image_url: '',
        id3: '',
    };

    if (!KakaoLogins) {
        console.log('Not Linked');
    }



    OneSignal.init("1dcdf0c6-ac3b-4120-adc4-2a41ece2bea7");

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
    console.log('dif1 Device info: ', device);
    console.log('dif2 Device info: ', device.userId );
    // this.setState({
    //   id3: device.userId,
    // });
    global.id3 = device.userId;
    console.log('dif3 global.id3: ', id3 );

  }



  // 이벤트 등록
  componentDidMount() {
    // BackHandler.addEventListener('hardwareBackPress', this.handleBackButton);
  }

  // 이벤트 해제
  componentWillUnmount() {
      // this.exitApp = false;
      // BackHandler.removeEventListener('hardwareBackPress', this.handleBackButton);
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




  _signInAsync = async () => {
      this.setState({
        isKakaoLogging: true
      })
  
      KakaoLogins.login()
        .then(result => {
          this.setState({
            token: JSON.stringify(result.accessToken),
            isKakaoLogging: false
          })
  
          KakaoLogins.getProfile()
          .then(result => {
            this.setState({
              id: `${JSON.stringify(result.id)}`,
              email: `${JSON.stringify(result.email)}`,
              profile_image_url: `${JSON.stringify(result.profile_image_url)}`,
              isKakaoLogging: false
            })
  
            return fetch(`http:/lotto.difsoft.com/app/api/?cmd=set_check_id_in_profile&mb_id=${result.id}`)
            .then((response) => response.json())
            .then((responseJson) => {
              if (responseJson) {
		            console.log("회원첵크");
                AsyncStorage.setItem('userId', `${result.id}`);
                this.props.navigation.navigate('Web_View', { kakaoID : `${result.id}` });

              } else {
                fetch(`http://lotto.difsoft.com/app/api/?cmd=register&mode=kakao&id=${result.id}&name=${result.nickname}&email=${global.id3}&profileImgUrl=${result.profile_image_url}&img_path=${result.profile_image_url}`)
                .then((response) => response.json())
                .then((responseJson) => {
                  if (responseJson.statusCode == 1) {
		                console.log("회원가입");
                    AsyncStorage.setItem('userId', `${result.id}`);
                    this.props.navigation.navigate('Web_View', { kakaoID : `${result.id}` });
                  }
                });
              }
            });   
            
          })
          .catch(err => {
            console.log(`${err.code}`, `${err.message}`);
            this.setState({
              isKakaoLogging: false
            })
          });
        })
        .catch(err => {
          if (err.code === 'E_CANCELLED_OPERATION') {
            console.log(`${err.message}`);
            this.setState({
              isKakaoLogging: false
            })
          } else {
            console.log(`${err.message}`);
            this.setState({
              isKakaoLogging: false
            })
          }
        });
    }; 

  kakaoLogout() {
    this.setState({
      isKakaoLogging: true
    })

    KakaoLogins.logout()
      .then(result => {
        this.setState({
          token: 'token has not fetched',
          id: 'profile has not fetched',
          email: 'profile has not fetched',
          profile_image_url: '',
          id3: '',
          isKakaoLogging: false
        })
      })
      .catch(err => {
        console.log(`${err.code}`, `${err.message}`);
        this.setState({
          isKakaoLogging: false
        })
      });
  };

  getProfile() {
    this.setState({
      isKakaoLogging: true
    })
    
    KakaoLogins.getProfile()
      .then(result => {
        this.setState({
          id: `${JSON.stringify(result.id)}`,
          email: `${JSON.stringify(result.email)}`,
          profile_image_url: `${JSON.stringify(result.profile_image_url)}`,
          isKakaoLogging: false
        })
        console.log(result);
        // console.log(login_web);
      })
      .catch(err => {
        console.log(`${err.code}`, `${err.message}`);
        this.setState({
          isKakaoLogging: false
        })
      });
  };
  
  render() {
    // console.log(this.state.id)
    return (
      <View style={styles.container}>
          <ImageBackground style={{ flex: 1 }} source={require("./images/Login_Background.jpg")} resizeMode="cover">
          <View style={styles.content}></View>
          <View style={styles.content}>
              <NativeButton
                  isLoading={this.state.isNaverLoggingin}
                  onPress={this._signInAsync}
                  activeOpacity={0.5}
                  style={styles.btnKakaoLogin}
                  textStyle={styles.txtNaverLogin}
              >카카오 로그인</NativeButton>

              {/* <Text>{this.state.token}</Text>

              <NativeButton
                  onPress={() => this.kakaoLogout()}
                  activeOpacity={0.5}
                  style={styles.btnKakaoLogin}
                  textStyle={styles.txtNaverLogin}
              >Logout</NativeButton>

              <NativeButton
                  isLoading={this.state.isKakaoLogging}
                  onPress={() => this.getProfile()}
                  activeOpacity={0.5}
                  style={styles.btnKakaoLogin}
                  textStyle={styles.txtNaverLogin}
              >getProfile</NativeButton>

              <Text>{this.state.id}</Text>
              <Text>{this.state.email}</Text> */}
          </View>
          </ImageBackground>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    marginTop: Platform.OS === 'android' ? 0 : 0,
    paddingTop: Platform.OS === 'android' ? 0 : 0,
  },
  header: {
    flex: 8.8,
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 87.5,
    flexDirection: 'column',
    justifyContent: 'center',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: 'black',
  },
  btnKakaoLogin: {
    height: 48,
    width: 240,
    alignSelf: 'center',
    backgroundColor: '#F8E71C',
    borderRadius: 0,
    borderWidth: 0,
  },
  txtNaverLogin: {
    fontSize: 16,
    color: '#3d3d3d',
  },
});

YellowBox.ignoreWarnings(['source.uri']);
