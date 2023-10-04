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
  padding: 1.5rem;
  padding-top: 2rem;
  padding-bottom: 0.5rem;
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
  const [chartData, setChartData] = useState([]); // New state for chart data
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
          // Set chart data for CSV export
          const chartData = Object.entries(data).map((entry) => {
            const [key, value] = entry;
            const namebirdaudio = key.split("/")[0];
            const nameCommPredict = value[0];
            const nameSciPredict = value[1];
            const timestart = value[2];
            const timesend = value[3];
            return {
              File_Name: namebirdaudio,
              Common_Name: removeAccents(nameCommPredict),
              Scientific_Name: nameSciPredict,
              Time_Start: timestart,
              Time_End: timesend,
            };
          });
          setChartData(chartData);
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

  function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  const downloadCSV = () => {
    if (chartData.length === 0) {
      alert("No data to download.");
      return;
    }

    const fileName = audioname + "_log.csv";

    const fields = [
      "File_Name",
      "Common_Name",
      "Scientific_Name",
      "Time_Start",
      "Time_End",
    ];
    try {
      const csvContent = chartData
        .map((row) => fields.map((field) => row[field]).join(","))
        .join("\n");
      const csv = `${fields.join(",")}\n${csvContent}`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error creating CSV:", error);
    }
  };

  return (
    <div className="container mx-auto">
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
          <Container className="text-center">
            <h4 className="mb-3 text-4xl">
              <b>File Details</b>
            </h4>
            <p className="mb-3">
              <b>File Name:</b> {audioname}
            </p>
            <p className="mb-3">
              <audio controls>
                <source
                  src={`http://127.0.0.1:5000/audios/${audioname}`}
                  type="audio/wav"
                />
                Your browser does not support the audio element.
              </audio>
            </p>
            <p className="mb-3">
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
                    fontSize: 16,
                  }}
                >
                  <img width={250} height={200} src={url} alt={name} />
                  <p className="mt-1">
                    {name === "Anomaly"
                      ? "Anomaly"
                      : class_scientificnames[class_commonnames.indexOf(name)]}
                  </p>
                </div>
              ))}
            </div>
            <button
              className="bg-gray-300 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center mt-3" /* Agregar la clase button-hover */
              onClick={downloadCSV}
            >
              <svg
                className="fill-current w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg>
              <span>Download CSV</span>
            </button>
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
                autosize: true,
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
              useResizeHandler
              className="w-full h-full"
            />
          </Container>
        </Fragment>
      ) : (
        <div className="text-center font-bold">
          Loading data audio...<Rotate>🦜</Rotate>
        </div>
      )}
    </div>
  );
}

export default Preview;
