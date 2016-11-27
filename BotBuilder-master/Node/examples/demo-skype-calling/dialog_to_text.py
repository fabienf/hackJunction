#!/usr/bin/env python3

import os
import sys
import json
import subprocess
import cPickle as pkl
import speech_recognition as sr

from IPython import embed


class DialogToSpeech:
    
    BING_KEY = "b465d23544dd4c358acbb0c631f0fbfe"
    AUDIO_DIR = "tmp"
    AUDIO_PATH_WAV = os.path.join(AUDIO_DIR, "sound.wav")
    AUDIO_PATH_WMA = os.path.join(AUDIO_DIR, "sound.wma")
    PICKLE_PATH = os.path.join(AUDIO_DIR, "pickled.pkl")
    
    def __init__(self):
        self.r = sr.Recognizer()
        
    def cleanup(self):
        if os.path.exists(self.AUDIO_PATH_WAV):
            os.remove(self.AUDIO_PATH_WAV)
    
    def parse(self, input):
        splitted = input.split(':')
        return json.loads(splitted[2][:-1])
    
    def forceFolder(self, path):
        dirpath = os.path.dirname(path)
        if not os.path.exists(dirpath):
            os.makedirs(dirpath)
    
    def save_to_pickle(self, content, path):
        self.forceFolder(path)
            
        with open('pickled.pkl', 'wb') as f:
            pkl.dump(content, f)
            print('content pickled!')
        
    def load_from_pickle(self, PICKLE_PATH):
        with open(PICKLE_PATH, 'rb') as f:
            print('loading pickled file!')
            return pkl.load(f)
    
    def save_to_file(self, parsed, filename):
        self.forceFolder(filename)
    
        with open(filename, "wb") as f:
            f.write(bytearray(parsed))
    
    def load_audio(self, filepath):  
        with sr.AudioFile(filepath) as source:
            return self.r.record(source)
    
    def convert_wma_to_wav(self, input_path, output_path):
        subprocess.call(["ffmpeg", "-loglevel", "panic", "-i", input_path, output_path], stdout=open(os.devnull, 'wb'))
    
    def ask_brocolli(self):
        audio = sys.stdin.readline().strip()
        parsed = self.parse(audio)
        self.save_to_pickle(parsed, self.PICKLE_PATH)
        
        return parsed
        
    def say_it(self, loaded_audio):
        try:
            recognized = self.r.recognize_bing(loaded_audio, key=self.BING_KEY)
            print("#135246#" + recognized)
        except sr.UnknownValueError:
            print("Microsoft Bing Voice Recognition could not understand audio")
        except sr.RequestError as e:
            print("Could not request results from Microsoft Bing Voice Recognition service; {0}".format(e))
        except:
            raise
  
    def translate(self):
        self.cleanup()
        print('1')
        parsed = self.ask_brocolli()
        print('2')
        self.save_to_file(parsed, self.AUDIO_PATH_WMA)
        print('3')
        self.convert_wma_to_wav(self.AUDIO_PATH_WMA, self.AUDIO_PATH_WAV)
        print('4')
        loaded_audio = self.load_audio(self.AUDIO_PATH_WAV)
        print('5')
        self.say_it(loaded_audio)

dts = DialogToSpeech()
dts.translate()
