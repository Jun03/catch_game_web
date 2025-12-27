import wave
import struct
import math
import os

def create_tone(filename, frequency=440, duration=0.2, vol=0.5):
    sample_rate = 44100
    n_samples = int(sample_rate * duration)
    
    with wave.open(filename, 'w') as obj:
        obj.setnchannels(1) # mono
        obj.setsampwidth(2) # 2 bytes
        obj.setframerate(sample_rate)
        
        for i in range(n_samples):
            value = int(32767.0 * vol * math.sin(2.0 * math.pi * frequency * i / sample_rate))
            try:
                data = struct.pack('<h', value)
                obj.writeframesraw(data)
            except:
                pass

os.makedirs('assets/audio', exist_ok=True)

# Generate sounds
create_tone('assets/audio/catch.wav', 880, 0.1)      # High ping
create_tone('assets/audio/hurt.wav', 150, 0.3)       # Low buzz
create_tone('assets/audio/gameover.wav', 100, 1.0)   # Long low drone
create_tone('assets/audio/milestone.wav', 660, 0.4)  # Medium chime

print("Audio files generated.")
