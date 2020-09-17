import * as React from 'react';
import {Text,View,StyleSheet,TouchableOpacity,TextInput,Image, Alert,KeyboardAvoidingView }from 'react-native';
import * as firebase from 'firebase';

export default class LoginScreen extends React.Component{
    constructor(){
        super()
        this.state={
            emailId:'',
            password:''
        }
    }
    login=async(emailId,password)=>{
        if (emailId && password){
            try {
                const response = await firebase.auth().signInWithEmailAndPassword(emailId,password)
                if (response){
                    this.props.navigation.navigate('Transaction')
                }
            }
            catch (error) {
                switch(error.code){
                    case 'user not found':
                        Alert.alert('User Does not Exist')
                        break;
                    case 'invaild-email':
                        Alert.alert("Invalid Email or Password")
                }
            }
        }
        else{
            Alert.alert("Enter email and password")
        }
    }
    render(){
        return(
           <KeyboardAvoidingView style={{alignItems:'center',marginTop:20}}>
            <View>
                <Image 
                source={require('../assets/booklogo.jpg')}
                style={{width:200,height:200}}/>
                <Text style={{textAlign:'center',fontSize:35}}>Willy</Text>
            </View>
            <View>
                <TextInput style={styles.loginBox} placeholder = {"Email Id"} keyboardType = "email-address"
                onChangeText = {(text)=>{
                    this.setState({
                        emailId:text
                    })
                }}/>
                <TextInput style={styles.loginBox} placeholder={"Password"} secureTextEntry = {true}
                onChangeText = {(text)=>{
                    this.setState({
                        password:text
                    })
                }}/>
            </View>
            <View>
                <TouchableOpacity style={styles.loginButton} onPress={()=>{
                    this.login(this.state.emailId,this.state.password)
                }}>
                  <Text>Login</Text>
                </TouchableOpacity>
            </View>
           </KeyboardAvoidingView>
        );
        
    }
    
 
}

const styles = StyleSheet.create({
    container:{
       flex:1,
       justifyContent:'center',
       alignItems:'center',
    },
    loginBox:{
        width:150,
        height:50,
    },
    loginButton:{
      backgroundColor:'orange'
    },
})