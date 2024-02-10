from flask import Flask, make_response, request, jsonify, send_from_directory, url_for
from torchvision.io import read_image
import os
from PIL import Image
from werkzeug.utils import secure_filename  # pip install Werkzeug
from flask_cors import (
    CORS,
)
from classifier import classifyAudio
import json

# ModuleNotFoundError: No module named 'flask_cors' = pip install Flask-Cors

app = Flask(__name__)
CORS(app, supports_credentials=True)

# app.secret_key = "caircocoders-ednalan"

UPLOAD_FOLDER = r"audios\\"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

ALLOWED_EXTENSIONS = set(["wav"])


def allowed_file(filename):
    """
    Verifica si la extensión del archivo es permitida.

    Args:
        filename (str): Nombre del archivo.

    Returns:
        bool: True si la extensión es permitida, False en caso contrario.
    """
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def main():
    """
    Ruta principal de la aplicación.

    Returns:
        str: Mensaje de bienvenida.
    """
    return "Homepage"


@app.route("/upload", methods=["POST"])
def upload_audio():
    """
    Ruta para subir archivos de audio.

    Returns:
        Response: Respuesta JSON que indica el estado de la operación.
    """
    # check if the post request has the file part
    if "file" not in request.files:
        resp = jsonify({"message": "No file part in the request", "status": "failed"})
        resp.status_code = 400
        return resp

    if len(os.listdir("audios/")) == 1:
        namedelete = os.listdir("audios/")[0]
        path = "audios/" + namedelete
        os.remove(path)
        print("% s removed successfully" % path)

    files = request.files.getlist("file")

    errors = {}
    success = False

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            route = app.config["UPLOAD_FOLDER"] + filename
            file.save(route)
            success = True
        else:
            resp = jsonify({"message": "File type is not allowed", "status": "failed"})
            return resp

    if success and errors:
        errors["message"] = "File(s) successfully uploaded"
        errors["status"] = "failed"
        resp = jsonify(errors)
        resp.status_code = 500
        return resp
    if success:
        resp = jsonify({"message": "Files successfully uploaded", "status": "successs"})
        resp.status_code = 201
        return resp
    else:
        resp = jsonify(errors)
        resp.status_code = 500
        return resp


@app.route("/get_birds", methods=["GET"])
def get_prediction():
    """
    Ruta para obtener la predicción de las especies de aves.

    Returns:
        Response: Respuesta JSON que contiene la predicción de las especies de aves.
    """
    try:
        if len(os.listdir("audios/")) == 1:
            filename = os.listdir("audios/")[0]
            response = classifyAudio(filename)
            resp = json.dumps(response)
            return resp
    except NameError:
        print(NameError)
        print("File wrong in uploading")


@app.route("/images/<filename>", methods=["GET"])
def get_image(filename):
    """
    Ruta para obtener imágenes.

    Args:
        filename (str): Nombre del archivo de imagen.

    Returns:
        Response: Respuesta con el archivo de imagen.
    """
    return send_from_directory("images/", filename)


@app.route("/audios/<filename>", methods=["GET"])
def get_audio(filename):
    """
    Ruta para obtener archivos de audio.

    Args:
        filename (str): Nombre del archivo de audio.

    Returns:
        Response: Respuesta con el archivo de audio.
    """
    return send_from_directory("audios/", filename)


if __name__ == "__main__":
    app.run(debug=True)
