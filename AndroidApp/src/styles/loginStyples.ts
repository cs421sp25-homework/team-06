import { StyleSheet } from 'react-native';

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#336749',
    textAlign: 'center',
  },
  highlight: {
    color: '#1976D2',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: '#336749',
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#336749',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#336749',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#007A8C',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 10,
  },
  signInText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#33415C',
    marginVertical: 10,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  icon: {
    color: '#33415C',
  },
  noAccount: {
    textAlign: 'center',
    color: '#33415C',
    marginVertical: 10,
  },
  signUpButton: {
    backgroundColor: 'rgba(246, 246, 246, 0.9)',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  signUpText: {
    color: '#007A8C',
    fontWeight: 'bold',
  },
});

export default loginStyles;
