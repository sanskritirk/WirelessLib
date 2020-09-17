import * as firebase from 'firebase';
require ('@firebase/firestore')

var firebaseConfig = {
    apiKey: "AIzaSyAT2054o4FXfAySmLUWxjVEfHnCmpmh8p8",
    authDomain: "wirleib-cdd52.firebaseapp.com",
    databaseURL: "https://wirleib-cdd52.firebaseio.com",
    projectId: "wirleib-cdd52",
    storageBucket: "wirleib-cdd52.appspot.com",
    messagingSenderId: "894245808810",
    appId: "1:894245808810:web:88aa5a733d2f787210bed3"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

export default firebase.firestore()
 