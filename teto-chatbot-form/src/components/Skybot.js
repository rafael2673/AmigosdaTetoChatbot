import React from 'react';
import './style/style.css';
import ChatBot from 'react-simple-chatbot';
import { ThemeProvider } from 'styled-components';
import BuscaMensagens from './BuscaMensagens';
import {theme, avatarStyle, bubbleOptionStyle, bubbleStyle, rootStyle, contentStyle, footerStyle, inputStyle, submitButtonStyle} from './style/theme'
import imageBot from '../../src/imgchat.png'

export default class Skybot extends React.Component {

    componentDidMount() {
        console.log("código!", "1061712315074-01");
    }

    render() {        

        const steps = [
            {
                id: 'first',
                component: <BuscaMensagens/>,
                asMessage: true,
                trigger: 'second'
            },
            {
                id: 'second',
                user: true,
                trigger: 'first',
            }
        ]    

        return (
            <ThemeProvider theme={theme}>
                <ChatBot
                    className='chat-container'                   
                    headerTitle="Seja bem-vindo"
                    avatarStyle={avatarStyle}
                    floating={true}
                    placeholder="Digite uma mensagem"
                    recognitionEnable={true}
                    recognitionLang="pt-br"
                    recognitionPlaceholder="Estou ouvindo ..."
                    botAvatar={imageBot}
                    floatingIcon={imageBot}
                    hideUserAvatar={true}
                    bubbleOptionStyle={bubbleOptionStyle}
                    bubbleStyle={bubbleStyle}
                    contentStyle={contentStyle}
                    footerStyle={footerStyle}
                    inputStyle={inputStyle}
                    enableSmoothScroll={true}
                    submitButtonStyle={submitButtonStyle}
                    enableMobileAutoFocus={true}
                    style={rootStyle}
                    steps={steps}
                />                
            </ThemeProvider>
        )
    }
}