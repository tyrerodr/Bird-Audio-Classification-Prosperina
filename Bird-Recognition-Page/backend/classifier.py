import os
import librosa
import io
import numpy as np
import datetime
import librosa
import noisereduce as nr
from keras.models import load_model
import tensorflow as tf
import sys

class_commonnames = [
    "Amazona Frentirroja",
    "Picamaderos de Guayaquil",
    "Tinamú Cejudo",
    "Chachalaca Cabecirrufa",
    "Busardo Dorsigrís",
    "Aratinga de Guayaquil",
]


class_scientificnames = [
    "Amazona Autamnails",
    "Campephilus gayaquilensis",
    "Crypturellus tansfasciatus",
    "Ortalis erythroptera",
    "Pseudastur occidentalis",
    "Psittacara erythrogenys",
]


def createSegmentationVectorPredict(segment_dur_secs, signal, sr, split):
    segment_length = sr * segment_dur_secs
    for s in range(0, len(signal), segment_length):
        t = signal[s : s + segment_length]
        split.append(t)
        if len(t) < segment_length and len(t) > segment_length:
            split.pop()
            miss = segment_length - len(t)
            missarray = np.zeros(miss)
            t = np.array(list(t) + list(missarray))
            split.append(t)
        elif len(t) < segment_length:
            split.pop()
    return split


def majority_vote(predictions):
    if len(predictions) == 0:
        return "Anomaly"

    unique_classes, counts = np.unique(predictions, return_counts=True)
    max_count = np.max(counts)

    if np.sum(counts == max_count) > 1:
        return "Anomaly"

    majority_class = unique_classes[np.argmax(counts)]
    return majority_class


def time_to_seconds(time_obj):
    total_seconds = int(time_obj.total_seconds())
    return total_seconds


def seconds_to_time(seconds):
    return datetime.time(
        hour=seconds // 3600, minute=(seconds % 3600) // 60, second=seconds % 60
    )


def createSpectogramVector(signal, sr):
    # Plot mel-spectrogram with high-pass filter
    N_FFT = 1024
    HOP_SIZE = 1024
    N_MELS = 128
    WIN_SIZE = 1024
    WINDOW_TYPE = "hann"
    FEATURE = "mel"
    FMIN = 0

    spectrogram = librosa.feature.mfcc(
        y=signal,
        sr=sr,
        n_mfcc=40,
        n_fft=N_FFT,
        hop_length=512,
        n_mels=N_MELS,
        htk=True,
        fmin=FMIN,
        fmax=sr / 2,
    )
    mean = np.mean(spectrogram)
    std = np.std(spectrogram)
    normalized_spectrogram = (spectrogram - mean) / std

    return normalized_spectrogram


def getprediction(file, predictions, timeserie):
    jsonPredictions = {}
    # Calcular el número de intervalos y el tamaño del intervalo en función de la duración del audio
    audio_duration = time_to_seconds(timeserie)  # Duración del audio en segundos
    interval_size = 8  # Tamaño del intervalo en segundos

    # Calcular el número de intervalos
    num_intervals = int(np.ceil(audio_duration / interval_size))

    # Dividir las predicciones en intervalos y aplicar enfoques
    for i in range(num_intervals):
        start_time = i * interval_size
        end_time = (i + 1) * interval_size
        interval_predictions = []
        for pred in predictions:
            pred_time_seconds = time_to_seconds(pred[2])
            if start_time < pred_time_seconds <= end_time:
                interval_predictions.append(pred[0])

        # Votación Mayoritaria
        if interval_predictions:  # Verificar si hay predicciones en este intervalo
            majority_prediction = majority_vote(interval_predictions)
            if majority_prediction == "Not Detected":
                scientificname = "Not Detected"
            elif majority_prediction == "Anomaly":
                scientificname = "Anomaly"
            else:
                scientificname = class_scientificnames[
                    class_commonnames.index(majority_prediction)
                ]

            jsonPredictions[
                file + "/" + seconds_to_time(start_time).strftime("%H:%M:%S")
            ] = [
                majority_prediction,
                scientificname,
                seconds_to_time(start_time).strftime("%H:%M:%S"),
                seconds_to_time(end_time).strftime("%H:%M:%S"),
            ]

    # Procesar el último intervalo si su tiempo excede el límite final
    last_start_time = (num_intervals - 1) * interval_size
    last_interval_predictions = []
    for pred in predictions:
        pred_time_seconds = time_to_seconds(pred[2])
        if last_start_time <= pred_time_seconds <= audio_duration:
            last_interval_predictions.append(pred[0])

    if last_interval_predictions:
        # Votación Mayoritaria para el último intervalo
        majority_prediction = majority_vote(last_interval_predictions)
        if majority_prediction == "Not Detected":
            scientificname = "Not Detected"
        elif majority_prediction == "Anomaly":
            scientificname = "Anomaly"
        else:
            scientificname = class_scientificnames[
                class_commonnames.index(majority_prediction)
            ]

        jsonPredictions[
            file + "/" + seconds_to_time(last_start_time).strftime("%H:%M:%S")
        ] = [
            majority_prediction,
            scientificname,
            seconds_to_time(last_start_time).strftime("%H:%M:%S"),
            seconds_to_time(audio_duration).strftime("%H:%M:%S"),
        ]

    return jsonPredictions


def classifyAudio(file):
    test_model = tf.keras.models.load_model("model/Bird_Recognition_Prosperina_CNN.h5")
    timeserie = 0
    predictions = []
    FILEPATH = os.path.join("audios/", file)
    signal, sr = librosa.load(FILEPATH)
    # signal = nr.reduce_noise(y=signal, y_noise=signal, prop_decrease=1, sr = sr)
    audio_slices = createSegmentationVectorPredict(2, signal, sr, [])
    timeserie = datetime.timedelta(seconds=0)
    for i in range(len(audio_slices)):
        vectorMFFC = createSpectogramVector(signal=audio_slices[i], sr=sr)
        vectoresPredict = [vectorMFFC]
        prediction = np.array(vectoresPredict)
        prediction = test_model.predict(prediction)
        timeserie = timeserie + datetime.timedelta(seconds=2)
        if prediction.max() > 0.85:
            predictions.append(
                (class_commonnames[prediction.argmax()], prediction.max(), timeserie)
            )
        else:
            predictions.append(("Not Detected", prediction.max(), timeserie))

    response = getprediction(file, predictions, timeserie)
    return response


# if __name__ == "__main__":
# response = classifyAudio(
#     "http://127.0.0.1:5000/81bd4ebf-30e2-4fbb-9e5e-fa17da26e610"
# )
# print(response)
