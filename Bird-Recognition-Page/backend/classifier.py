import os
import io
import numpy as np
import datetime
import librosa
import noisereduce as nr
from keras.models import load_model
import tensorflow as tf

class_commonnames = [
    "Red-lored Parrot",
    "Guayaquil Woodpecker",
    "Pale-browed Tinamou",
    "Rufous-headed Chachalaca",
    "Gray-backed Hawk",
    "Red-masked Parakeet",
]

class_scientificnames = [
    "Amazona autumnalis",
    "Campephilus gayaquilensis",
    "Crypturellus transfasciatus",
    "Ortalis erythroptera",
    "Pseudastur occidentalis",
    "Psittacara erythrogenys",
]


def createSegmentationVectorPredict(segment_dur_secs, signal, sr, split):
    """
    Divide una señal de audio en segmentos de duración específica.

    Args:
        segment_dur_secs (int): Duración deseada de cada segmento en segundos.
        signal (np.ndarray): Señal de audio.
        sr (int): Tasa de muestreo de la señal de audio.
        split (list): Lista para almacenar los segmentos divididos.

    Returns:
        list: Lista de segmentos divididos.
    """
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


def weighted_majority_vote(predictions):
    """
    Realiza un voto ponderado para determinar la clase predicha.

    Args:
        predictions (list): Lista de predicciones.

    Returns:
        str: Clase predicha.
    """
    if len(predictions) == 0:
        return "Anomaly"

    unique_classes, counts = np.unique(predictions, return_counts=True)

    class_weights = [2 if cls != "Not Detected" else 1 for cls in unique_classes]
    weighted_counts = [count * weight for count, weight in zip(counts, class_weights)]

    max_count = np.max(weighted_counts)

    if np.sum(weighted_counts == max_count) > 1:
        return "Anomaly"

    majority_class = unique_classes[np.argmax(weighted_counts)]
    return majority_class


def time_to_seconds(time_obj):
    """
    Convierte un objeto de tiempo en segundos.

    Args:
        time_obj (datetime.timedelta): Objeto de tiempo.

    Returns:
        int: Tiempo en segundos.
    """
    total_seconds = int(time_obj.total_seconds())
    return total_seconds


def seconds_to_time(seconds):
    """
    Convierte segundos en un objeto de tiempo.

    Args:
        seconds (int): Tiempo en segundos.

    Returns:
        datetime.time: Objeto de tiempo.
    """
    return datetime.time(
        hour=seconds // 3600, minute=(seconds % 3600) // 60, second=seconds % 60
    )


def createSpectogramVector(signal, sr):
    """
    Crea un espectrograma de la señal de audio.

    Args:
        signal (np.ndarray): Señal de audio.
        sr (int): Tasa de muestreo de la señal de audio.

    Returns:
        np.ndarray: Espectrograma normalizado.
    """
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


def get_prediction(file, predictions, timeserie):
    """
    Realiza predicciones para segmentos de audio y agrupa los resultados.

    Args:
        file (str): Nombre del archivo de audio.
        predictions (list): Lista de predicciones por segmento.
        timeserie (datetime.timedelta): Duración total del audio.

    Returns:
        dict: Predicciones agrupadas por intervalo de tiempo.
    """
    jsonPredictions = {}
    audio_duration = time_to_seconds(timeserie)
    interval_size = 8
    num_intervals = int(np.ceil(audio_duration / interval_size))

    for i in range(num_intervals):
        start_time = i * interval_size
        end_time = (i + 1) * interval_size
        interval_predictions = []
        for pred in predictions:
            pred_time_seconds = time_to_seconds(pred[2])
            if start_time < pred_time_seconds <= end_time:
                interval_predictions.append(pred[0])

        majority_prediction = weighted_majority_vote(interval_predictions)
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

    if end_time > audio_duration:
        last_start_time = end_time - interval_size
        last_interval_predictions = []
        for pred in predictions:
            pred_time_seconds = time_to_seconds(pred[2])
            if last_start_time <= pred_time_seconds <= audio_duration:
                last_interval_predictions.append(pred[0])

        if len(last_interval_predictions) < 4:
            majority_prediction = "Not Detected"
            scientificname = "Not Detected"
        else:
            majority_prediction = weighted_majority_vote(last_interval_predictions)
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
    """
    Clasifica el archivo de audio dado.

    Args:
        file (str): Nombre del archivo de audio.

    Returns:
        dict: Predicciones de especies de aves agrupadas por intervalo de tiempo.
    """
    test_model = tf.keras.models.load_model("model/Bird_Recognition_Prosperina_CNN.h5")
    timeserie = 0
    predictions = []
    FILEPATH = os.path.join("audios/", file)
    signal, sr = librosa.load(FILEPATH)
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

    response = get_prediction(file, predictions, timeserie)
    return response
