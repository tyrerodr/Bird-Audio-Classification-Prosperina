import React, { Fragment, useEffect, useState } from "react";
import styled from "styled-components";
import { keyframes } from "styled-components";
import Plot from "react-plotly.js";
import "./preview.css";
const rotate = keyframes`
from {
  transform: rotate(0deg);
}

to {
  transform: rotate(360deg);
}
`;
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Rotate = styled.div`
  display: inline-block;
  animation: ${rotate} 2s linear infinite;
  padding: 2rem 1rem;
  font-size: 1.2rem;
`;

function Preview(props) {
  const [data, setData] = useState(null);
  const [audioname, setAudioName] = useState("");
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [images, setImages] = useState({});

  let commonnames = [];
  let songstimestart = [];
  let songstimeend = [];
  let class_commonnames = [
    "Amazona Frentirroja",
    "Picamaderos de Guayaquil",
    "Tinamú Cejudo",
    "Chachalaca Cabecirrufa",
    "Busardo Dorsigrís",
    "Aratinga de Guayaquil",
  ];
  let class_scientificnames = [
    "Amazona Autamnails",
    "Campephilus gayaquilensis",
    "Crypturellus tansfasciatus",
    "Ortalis erythroptera",
    "Pseudastur occidentalis",
    "Psittacara erythrogenys",
  ];
  useEffect(() => {
    fetch("http://127.0.0.1:5000/get_birds")
      .then((res) =>
        res.json().then((data) => {
          // Setting data from api
          setData(data);
        })
      )
      .catch((error) => {
        console.error(error);
        if (error.response) {
          console.log(error.response);
          if (error.response.status === 401) {
            alert("Invalid credentials");
          }
        }
      });
  }, []);

  useEffect(() => {
    // Function to get images
    function getImages() {
      let newImages = {};
      const promises = commonnames.filter(onlyUnique).map((imagename) => {
        const url = "http://127.0.0.1:5000/images/" + imagename + ".jpg";
        return fetch(url)
          .then((response) => response.blob())
          .then((blob) => {
            const imgUrl = URL.createObjectURL(blob);
            if (
              (class_commonnames.includes(imagename) ||
                imagename === "Anomaly") &&
              !newImages[imagename]
            ) {
              newImages[imagename] = imgUrl;
            }
          });
      });

      Promise.all(promises).then(() => {
        setImages(newImages);
        setImagesLoaded(true);
      });
    }

    if (commonnames.length > 0 && !imagesLoaded) {
      getImages();
    }
    // eslint-disable-next-line
  }, [commonnames, imagesLoaded]);

  function onlyUnique(value, index, array) {
    // eslint-disable-next-line
    return value != "Not Detected" && array.indexOf(value) === index;
  }

  return (
    <div className="text-center">
      {data ? (
        <Fragment>
          {Object.entries(data).forEach((entry) => {
            const [key, value] = entry;
            const namebirdaudio = key.split("/")[0];
            const nameCommPredict = value[0];
            const timestart = value[2];
            const timesend = value[3];
            if (audioname === "") {
              setAudioName(namebirdaudio);
            }
            commonnames.push(nameCommPredict);
            songstimestart.push(timestart);
            songstimeend.push(timesend);
          })}
          <Container>
            <h4>
              <b>File Details</b>
            </h4>
            <p>
              <b>File Name:</b> {audioname}
            </p>
            <p>
              <audio controls>
                <source
                  src={`http://127.0.0.1:5000/audios/${audioname}`}
                  type="audio/wav"
                />
                Your browser does not support the audio element.
              </audio>
            </p>
            <p>
              <b>Total Audio Time: </b>
              {songstimeend.slice(-1)} h:m:s
            </p>
            <p>
              <b>Species Found into Audio:</b>
            </p>
            <div className="images-container">
              {Object.entries(images).map(([name, url]) => (
                <div
                  className="font-italic"
                  key={name}
                  style={{
                    margin: "10px",
                  }}
                >
                  <p>
                    {name === "Anomaly"
                      ? "Anomaly"
                      : class_scientificnames[class_commonnames.indexOf(name)]}
                  </p>
                  <img width={250} height={200} src={url} alt={name} />
                </div>
              ))}
            </div>
          </Container>
          <Plot
            data={[
              {
                x: ["0:00:00", ...songstimeend],
                y: ["Not Detected", ...commonnames].map((name) =>
                  name === "Not Detected" ? 0 : 1
                ),
                mode: "markers",
                marker: {
                  color: [
                    "green",
                    ...commonnames.map((name) =>
                      name === "Anomaly" ? "rgba(255, 0, 0, 0.9)" : "green"
                    ),
                  ],
                  size: 10,
                },
                type: "scatter",
                fill: "tozeroy",
                fillcolor: "rgba(0, 128, 0, 0.5)", // Cambiar opacidad a 0.3
                hovertext: ["Not Detected", ...commonnames].map(
                  (name, index) => {
                    if (name === "Not Detected") {
                      return "";
                    } else {
                      const startTime =
                        index === 0 ? "0:00:00" : songstimestart[index - 1];
                      const endTime = songstimeend[index - 1];
                      return `Species: ${name}, Time Period: (${startTime} - ${endTime})`;
                    }
                  }
                ),
              },
            ]}
            layout={{
              width: 1260,
              height: 400,
              title: "Bird Detection in Audio Over Time",
              xaxis: {
                title: "Time (h:m:s)",
                rangemode: "tozero",
              },
              yaxis: {
                tickvals: [0, 1],
                ticktext: ["Not Detected", "Detected"],
              },
              hovermode: "closest",
            }}
          />
        </Fragment>
      ) : (
        <div className="text-center">
          Loading data audio...<Rotate>🦜</Rotate>
        </div>
      )}
    </div>
  );
}

export default Preview;
