import * as React from 'react';
import { StyleSheet, Text, View,TouchableOpacity,TextInput,Image,Alert,KeyboardAvoidingView,ToastAndroid} from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config';


export default class BookTransactionScreen extends React.Component{
  constructor(){
    super()
    this.state={
      hasCameraPermissions:null,
      scanned:false,
      scannedData:' ',
      scannedBookId:'',
      scanedStudentId:'',
      buttonState:'normal',
    }
  }
  getCameraPermissions=async(id)=>{
       const {status}=await Permissions.askAsync(Permissions.CAMERA)
       this.setState({
         hasCameraPermissions: status==='granted',
         buttonState:id,
         scanned:false
       })
  }
  handleBarCodeScanned=async({type,data})=>{
    const {buttonState} = this.state;
    if (buttonState === "BookID")
    {
      this.setState({
        scanned:true,
        scannedBookId:data,
        buttonState:'normal',
      })
    }
    else if (buttonState === "StudentID")
    {
    this.setState({
      scanned:true,
      scannedStudentId:data,
      buttonState:'normal',
    })
  }
}
handleTransaction=async()=>{
  var transactionType=await this.checkBookAvailable()
  if (! transactionType){
    Alert.alert("Book does not exist in the library database")
    this.setState({
      scannedStudentId:" ",
      scannedBookId:" ",
    })
  }
  else if (transactionType === "Issued"){
    var isStudentEligible = await this.checkStudentEligiblityForBookIssue()
    if (isStudentEligible){
      this.initiateBookIssue()
      Alert.alert("Book Issued to the Student")
    }
  }
  else{
    var isStudentEligible = await this.checkStudentEligiblityForBookReturn()
    if (isStudentEligible){
      this.initiateBookReturn()
      Alert.alert("Book Returned to the Library")
    }
  }
  var transactionMessage;
  db.collection('books').doc(this.state.scannedBookId).get()
  .then(doc=>{
    var book=doc.data()
    if (book.bookAvailability){
      this.initiateBookIssue()
      transactionMessage='Book Issued';
     //Alert.alert(transactionMessage)
     ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)
    }
    else {
      this.initiateBookReturn()
      transactionMessage="Book Returned"
      //Alert.alert(transactionMessage)
      ToastAndroid.show(transactionMessage,transactionMessage.SHORT)
        }
  })
  this.setState({
    transactionMessage:transactionMessage,
  })
}
initiateBookIssue=async()=>{
  db.collection('transactions').add({
    'studentId':this.state.scannedStudentId,
    'bookId':this.state.scannedBookId,
    'date':firebase.firestore.Timestamp.now().toDate(),
    'transactionType':'Issued'
  })
  //change book status
  db.collection("books").doc(this.state.scannedBookId).update({
    "bookAvailability" : false
  })
  //change no of books issued for student
  db.collection("students").doc(this.state.scannedStudentId).update({
    "noOfBooksIssued":firebase.firestore.FieldValue.increment(1)
  })
  Alert.alert('Book Issued')
  this.setState({
    scannedBookId:'',
    scannedStudentId:''
  })
}
initiateBookReturn=async()=>{
  db.collection('transactions').add({
    'studentId':this.state.scanedStudentId,
    'bookId':this.state.scannedBookId,
    'date':firebase.firestore.Timestamp.now().toDate(),
    'transactionType':'Returned'
  })
  //change book status
  db.collection("books").doc(this.state.scannedBookId).update({
    "bookAvailability":true
  })
  //change no of books issued for students
  db.collection("students").doc(this.state.scannedStudentId).update({
    "noOfBooksIssued":firebase.firestore.FieldValue.increment(-1)
  })
  Alert.alert('Book Returned')
  this.setState({
    scannedBookId:'',
    scannedStudentId:''
  })
}
checkStudentEligiblityForBookIssue=async()=>{
  const studentRef = await db.collection("students").where("studentId","==",this.state.scannedStudentId).get()
  var isStudentEligible = ""
  if (studentRef.docs.length === 0){
    this.setState({
      scannedBookId:"",
      scannedStudentId:""   
    })
    isStudentEligible=false
    Alert.alert("Student Id does not exist in database")
  }
  else {
    studentRef.docs.map(doc=>{
      var student = doc.data()
      if (student.noOfBooksIssued<2){
        isStudentEligible=true
      }
      else{
        isStudentEligible=false
        Alert.alert("Student has issued two books")
        this.setState({
          scannedStudentId:"",
          scannedBookId:"",
        })
      }
    })
  }
  return isStudentEligible;
}
checkStudentEligiblityForBookReturn=async()=>{
  const transactionRef = await db.collection("transactions").where("bookId","==",this.state.scannedBookId).limit(1).get()
  var isStudentEligible = ""
  transactionRef.docs.map(doc=>{
    var lastBookTransaction = doc.data()
    if (lastBookTransaction.studentId === this.state.scannedStudentId){
      isStudentEligible=true
    }
    else{
      isStudentEligible=false
      Alert.alert("The book was not issued by the student")
      this.setState({
        scannedStudentId:"",
        scannedBookId:""
      })
    }
  })
  return isStudentEligible;
}
checkBookAvailable=async()=>{
  const bookRef = await db.collection("books").where("bookId","==",this.state.scannedBookId).get()
  var transactionType=""
  if (bookRef.docs.length === 0){
    transactionType=false
  }
  else{
    bookRef.docs.map(doc=>{
      var books = doc.data()
      if (books.bookAvailability){
        transactionType="Issued"
      }
      else{
        transactionType="Returned"
      }
    })
  }
  return transactionType;
}
  render(){
    const hasCameraPermissions=this.state.hasCameraPermissions;
    const scanned=this.state.scanned;
    const buttonState=this.state.buttonState;
    if (buttonState !== 'normal' && hasCameraPermissions){
      return (
        <BarCodeScanner 
        onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}/>
      )
    }
    else if(buttonState==='normal'){
    return(
      <KeyboardAvoidingView style={styles.container} behavior='padding' enabled>
        <View>
          <Image 
          source={require('../assets/booklogo.jpg')}
          style={{width:200,height:200}}/>
          <Text style={{textAlign:'center',fontSize:30}}>Willy</Text>
        </View>
         <View style={styles.inputView}>
           <TextInput style={styles.inputBox} placeholder="Book ID" value={this.state.scannedBookId} 
           onChangeText={(text)=>{
               this.setState({
                 scannedBookId:text
               })
           }}/>
           <TouchableOpacity style={styles.scanButton} onPress={()=>{this.getCameraPermissions("BookID")}}>
             <Text style={styles.buttonText}>Scan</Text>
           </TouchableOpacity>
           </View> 
           <View style={styles.inputView}>
           <TextInput style={styles.inputBox} placeholder="Student ID" value={this.state.scanedStudentId}
           onChangeText={(text)=>{
             this.setState({
               scanedStudentId:text
             })
           }}/>
           <TouchableOpacity style={styles.scanButton} onPress={()=>{this.getCameraPermissions("StudentID")}}>
             <Text style={styles.buttonText}>Scan</Text>
           </TouchableOpacity>
           </View> 
           <TouchableOpacity style={styles.submitButton} onPress={async()=>{
             var transactionMessage=this.handleTransaction()
             this.setState({
               scanedStudentId:'',
               scannedBookId:''
             })}}>
             <Text style={styles.submitText}>Submit</Text>
           </TouchableOpacity>
           
      </KeyboardAvoidingView>
    );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  displaytxt:{
    fontSize:20,
  },
  scanButton:{
    backgroundColor:'orange',  
    width:50,
    borderWidth:1.5,
    borderLeftWidth:0,
  },
  buttonText:{
    fontSize:15,
    fontWeight:'bold',
  },
  inputView:{
    flexDirection:'row',
    margin:20,
  },
  inputBox:{
    width:200,
    height:40,
    borderWidth:1.5,
    borderRightWidth:0,
    fontSize:20,
  },
  submitButton:{
    height:50,
    width:100,
    backgroundColor:'orange',
  },
submitText:{
  padding:10,
  textAlign:'center',
  fontSize:20,
  fontWeight:'bold',
  color:'white'
}

});
