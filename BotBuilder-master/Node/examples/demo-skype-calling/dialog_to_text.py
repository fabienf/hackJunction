#!/usr/bin/env python3

import os
import sys
import json 
import cPickle as pkl
import speech_recognition as sr
import subprocess

from IPython import embed


r = sr.Recognizer()
BING_KEY = "b465d23544dd4c358acbb0c631f0fbfe"
AUDIO_DIR = "tmp"
AUDIO_PATH_WAV = os.path.join(AUDIO_DIR, "sound.wav")
AUDIO_PATH_WMA = os.path.join(AUDIO_DIR, "sound.wma")
PICKLE_PATH = os.path.join(AUDIO_DIR, "pickled.pkl")


def cleanup():
    if os.path.exists(AUDIO_PATH_WAV):
        os.remove(AUDIO_PATH_WAV)

def parse(input):
    splitted = input.split(':')
    return json.loads(splitted[2][:-1])

def forceFolder(path):
    dirpath = os.path.dirname(path)
    if not os.path.exists(dirpath):
        os.makedirs(dirpath)

def save_to_pickle(content, path):
    forceFolder(path)
        
    with open('pickled.pkl', 'wb') as f:
        pkl.dump(content, f)
        print('content pickled!')
    
def load_from_pickle(PICKLE_PATH):
    with open(PICKLE_PATH, 'rb') as f:
        print('loading pickled file!')
        return pkl.load(f)

def save_to_file(parsed, filename):
    forceFolder(filename)

    with open(filename, "wb") as f:
        f.write(bytearray(parsed))

def load_audio(filepath):  
    with sr.AudioFile(filepath) as source:
        return r.record(source)

def convert_wma_to_wav(input_path, output_path):
    subprocess.call(["ffmpeg", "-loglevel", "panic", "-i", input_path, output_path], stdout=open(os.devnull, 'wb'))

def ask_brocolli():
    audio = sys.stdin.readline().strip()
    parsed = parse(audio)
    save_to_pickle(parsed, PICKLE_PATH)
    
    return parsed
  





cleanup()
parsed = ask_brocolli()
print('1')
save_to_file(parsed, AUDIO_PATH_WMA)
print('2')
convert_wma_to_wav(AUDIO_PATH_WMA, AUDIO_PATH_WAV)
print('3')
loaded_audio = load_audio(AUDIO_PATH_WAV)
print('4')

try:
    recognized = r.recognize_bing(loaded_audio, key=BING_KEY)
    print("Microsoft Bing Voice Recognition thinks you said " + recognized)
except sr.UnknownValueError:
    print("Microsoft Bing Voice Recognition could not understand audio")
except sr.RequestError as e:
    print("Could not request results from Microsoft Bing Voice Recognition service; {0}".format(e))
except:
    raise
