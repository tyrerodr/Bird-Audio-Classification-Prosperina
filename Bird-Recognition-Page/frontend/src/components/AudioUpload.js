import React, { Component } from "react";
import axios from "axios";
import Preview from "./preview";

export class AudioUpload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audio: "",
      preview: "",
      responseMsg: {
        status: "",
        message: "",
        error: "",
      },
    };

    this.birds = {
      result: "",
    };

    this.effectvalue = {
      value: false,
    };
  }

  // audio onchange hander
  handleChange = (e) => {
    this.fileValidate(e.target.files[0]);
    this.setState({
      audio: e.target.files[0],
    });
    this.setState({
      preview: "",
    });
  };
  // submit handler
  submitHandler = (e) => {
    this.effectvalue.value = true;
    // console.log(this.state.audio);
    e.preventDefault();
    const data = new FormData();

    data.append("file", this.state.audio);
    // console.log(data);
    axios
      .post("http://127.0.0.1:5000/upload", data)
      .then((response) => {
        if (response.status === 201) {
          this.setState({
            responseMsg: {
              status: response.data.status,
              message: response.data.message,
            },
          });

          setTimeout(() => {
            this.setState({
              audio: "",
              responseMsg: "",
            });
          }, 3000);

          document.querySelector("#audioForm").reset();
        }
        // alert("Successfully Uploaded");
        this.setState({
          preview: <Preview />,
        });
      })
      .catch((error) => {
        console.error(error);
        if (error.response) {
          console.log(error.response);
          if (error.response.status === 401) {
            alert("Invalid credentials");
          }
        }
      });
  };

  // file validation
  fileValidate = (file) => {
    if (file.type === "audio/wav") {
      const button = document.querySelector("#button");
      button.disabled = false;
      this.setState({
        responseMsg: {
          error: "",
        },
      });
      return true;
    } else {
      const button = document.querySelector("#button");
      button.disabled = true;
      this.setState({
        responseMsg: {
          status: "failed",
          message: "File type allowed only .wav",
        },
      });
      return false;
    }
  };

  render() {
    return (
      <div className="container py-5">
        <div className="row">
          <div className="col-lg-12">
            <form
              onSubmit={this.submitHandler}
              encType="multipart/form-data"
              id="audioForm"
            >
              <div className="card-shadow">
                {this.state.responseMsg.status === "successs" ? (
                  <div className="alert alert-success" id="successid">
                    {this.state.responseMsg.message}
                  </div>
                ) : this.state.responseMsg.status === "failed" ? (
                  <div className="alert alert-danger">
                    {this.state.responseMsg.message}
                  </div>
                ) : (
                  ""
                )}
              </div>
              <div className="card shadow">
                <div
                  className="card-header"
                  style={{
                    padding: 30,
                    // backgroundColor: "#198754",
                    backgroundImage: `url(${"http://127.0.0.1:5000/images/background-header.png"})`, // URL de la imagen de fondo
                    backgroundSize: "cover", // Ajusta el tamaño de la imagen para cubrir todo el div
                    backgroundPosition: "button", // Centra la imagen en el div
                    display: "flex", // Agrega la propiedad display: flex
                    alignItems: "center", // Centra verticalmente los elementos
                  }}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}/logo.png`} // Utiliza process.env.PUBLIC_URL
                    alt="Imagen de encabezado"
                    style={{
                      width: "100px", // Ajusta el tamaño de la imagen según tus necesidades
                      height: "auto",
                      marginRight: "10px", // Agrega un espacio entre la imagen y el título
                    }}
                  />
                  <h4
                    className="card-title fw-bold"
                    style={{
                      fontSize: 35,
                      margin: 9,
                      color: "#ffffff",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.7)", // Agrega un sombreado al texto
                    }}
                  >
                    Bird Audio Recognition
                  </h4>
                </div>

                <div className="card-body">
                  <div className="form-group py-2">
                    <label htmlFor="audios">Audios</label>
                    <input
                      type="file"
                      name="audio"
                      multiple
                      onChange={this.handleChange}
                      className="form-control"
                    />
                    <span className="text-danger">
                      {this.state.responseMsg.error}
                    </span>
                    <div className="form-group py-2">
                      <div className="text-preview text-center">
                        {this.state.preview}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-footer">
                  <button
                    id="button"
                    type="submit"
                    disabled={true}
                    onClick={(e) => this.submitHandler(e)}
                    className="btn btn-success" /* Agregar la clase button-hover */
                    style={{ backgroundColor: "#2aab56" }}
                  >
                    Search Species
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
}
