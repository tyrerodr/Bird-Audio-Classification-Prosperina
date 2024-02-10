import React, { Fragment, useEffect, useState } from "react";
import styled from "styled-components";
import { keyframes } from "styled-components";
import Plot from "react-plotly.js";
import "./preview.css";
import "./audioDetails";
import AudioDetails from "./audioDetails";
import AudioPlayer from "./audioPlayer";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  padding-top: 2rem;
  padding-bottom: 0.5rem;
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
  const [chartData, setChartData] = useState([]);
  const [dataWithSplits, setdataWithSplits] = useState([]);
  const [showSplits, setShowSplits] = useState(false);
  const [showTimeSeries, setShowTimeSeries] = useState(false);
  let class_commonnames = [
    "Red-lored Parrot",
    "Guayaquil Woodpecker",
    "Pale-browed Tinamou",
    "Rufous-headed Chachalaca",
    "Gray-backed Hawk",
    "Red-masked Parakeet",
  ];

  let commonnames = [];
  let scinames = [];
  let songstimestart = [];
  let songstimeend = [];

  let class_scientificnames = [
    "Amazona autumnalis",
    "Campephilus gayaquilensis",
    "Crypturellus transfasciatus",
    "Ortalis erythroptera",
    "Pseudastur occidentalis",
    "Psittacara erythrogenys",
  ];

  useEffect(() => {
    setdataWithSplits([]);
    setChartData([]);
    fetch("http://127.0.0.1:5000/get_birds")
      .then((res) =>
        res.json().then((data) => {
          setData(data);
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

          const dataWithSplits = Object.entries(data).reduce(
            (result, [key, value]) => {
              const namebirdaudio = key;
              const nameSciPredict = value[1];
              const timestart = value[2];
              const timesend = value[3];
              console.log(data);

              const existingItem = result.find(
                (x) => x.splitInfo === namebirdaudio
              );

              const splitInfo = {
                splitName: namebirdaudio,
                startTime: timestart,
                endTime: timesend,
              };

              if (existingItem) {
                existingItem.splits.push(splitInfo);
              } else {
                result.push({
                  namebirdaudio,
                  nameCommPredict: nameSciPredict,
                  splits: [splitInfo],
                });
              }
              return result;
            },
            []
          );

          setdataWithSplits(dataWithSplits);
          setChartData(chartData);
        })
      )
      .catch((error) => {
        console.error(error);
        if (error.response) {
          console.log(error.response);
          if (error.response.status === 401) {
            alert("Credenciales inválidas");
          }
        }
      });
  }, []);

  useEffect(() => {
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
    return value !== "Not Detected" && array.indexOf(value) === index;
  }

  const groupedData = dataWithSplits.reduce((result, item) => {
    const existingItem = result.find(
      (x) => x.nameCommPredict === item.nameCommPredict
    );

    if (existingItem) {
      item.splits.forEach((split, index) => {
        existingItem.splits.push({
          ...split,
          key: `${item.nameCommPredict}_${item.namebirdaudio}_${index}`,
        });
      });
    } else {
      const splitsWithKeys = item.splits.map((split, index) => ({
        ...split,
        key: `${item.nameCommPredict}_${item.namebirdaudio}_${index}`,
      }));

      result.push({
        nameCommPredict: item.nameCommPredict,
        splits: splitsWithKeys,
      });
    }

    return result;
  }, []);

  function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  const downloadCSV = () => {
    if (chartData.length === 0) {
      alert("No hay datos para descargar.");
      return;
    }

    const fileName = audioname + "_log.csv";

    // Mapping object for translation
    const fieldTranslations = {
      File_Name: "Nombre_Archivo",
      Common_Name: "Nombre_Comun",
      Scientific_Name: "Nombre_Cientifico",
      Time_Start: "Tiempo_Inicio",
      Time_End: "Tiempo_Fin",
    };

    // Use translated field names
    const fields = Object.keys(fieldTranslations);

    try {
      const csvContent = chartData
        .map((row) => fields.map((field) => row[field] || "").join(","))
        .join("\n");
      const csv = `${fields
        .map((field) => fieldTranslations[field])
        .join(",")}\n${csvContent}`;

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
      console.error("Error al crear CSV:", error);
    }
  };

  const timeToSeconds = (timeString) => {
    const [hours, minutes, seconds] = timeString.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  return (
    <div className="container mx-auto">
      {data ? (
        <Fragment>
          {Object.entries(data).forEach((entry) => {
            const [key, value] = entry;
            const namebirdaudio = key.split("/")[0];
            const nameCommPredict = value[0];
            const nameSciPredict = value[1];
            const timestart = value[2];
            const timesend = value[3];
            if (audioname === "") {
              setAudioName(namebirdaudio);
            }
            commonnames.push(nameCommPredict);
            scinames.push(nameSciPredict);
            songstimestart.push(timestart);
            songstimeend.push(timesend);
          })}
          <AudioDetails
            audioname={audioname}
            images={images}
            songstimeend={songstimeend}
            class_scientificnames={class_scientificnames}
            class_commonnames={class_commonnames}
          />
          <Container className="text-center">
            <div className="button-container">
              <button
                className="bg-gray-300 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                onClick={downloadCSV}
              >
                <svg
                  className="fill-current w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                </svg>
                <span>Descargar archivo de detecciones</span>
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                onClick={() => setShowSplits(!showSplits)}
              >
                <svg
                  className="fill-current w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 2 20 20"
                >
                  <path
                    d="M8 6.00067L21 6.00139M8 12.0007L21 12.0015M8 18.0007L21 18.0015M3.5 6H3.51M3.5 12H3.51M3.5 18H3.51M4 6C4 6.27614 3.77614 6.5 3.5 6.5C3.22386 6.5 3 6.27614 3 6C3 5.72386 3.22386 5.5 3.5 5.5C3.77614 5.5 4 5.72386 4 6ZM4 12C4 12.2761 3.77614 12.5 3.5 12.5C3.22386 12.5 3 12.2761 3 12C3 11.7239 3.22386 11.5 3.5 11.5C3.77614 11.5 4 11.7239 4 12ZM4 18C4 18.2761 3.77614 18.5 3.5 18.5C3.22386 18.5 3 18.2761 3 18C3 17.7239 3.22386 17.5 3.5 17.5C3.77614 17.5 4 17.7239 4 18Z"
                    stroke="#000000"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                <span>
                  {showSplits
                    ? "Ocultar lista de detecciones"
                    : "Mostrar lista de detecciones"}
                </span>
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                onClick={() => setShowTimeSeries(!showTimeSeries)}
              >
                <svg
                  className="fill-current w-4 h-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 5 20 20"
                >
                  <path d="M0 25.406h22.406v-1.75h-20.656v-17.063h-1.75v18.813zM3.063 21.969h19.25v-13.813l-4.063 3.719-3.781-1.375-4 4.563-4.094-1.469-3.313 3.438v4.938z"></path>
                </svg>
                <span>
                  {showTimeSeries
                    ? "Ocultar Gráfico de tiempo de Detecciones"
                    : "Gráfico de tiempo de Detecciones"}
                </span>
              </button>
            </div>
            {console.log(groupedData)}
            {showSplits &&
              groupedData
                .filter((bird) => bird.nameCommPredict !== "Not Detected")
                .map((bird) => (
                  <div key={bird.id}>
                    <table className="table">
                      <thead className="table-header">
                        <tr>
                          <th className="table-header">Especie</th>
                          <th className="table-header">Hora de Inicio</th>
                          <th className="table-header">Hora de Fin</th>
                          <th className="table-header">Detección</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bird.splits.map((split) => (
                          <tr key={split.splitName}>
                            <td className="table-cell">
                              {bird.nameCommPredict}
                            </td>
                            <td className="table-cell">{split.startTime}</td>
                            <td className="table-cell">{split.endTime}</td>
                            <td className="table-cell">
                              <AudioPlayer
                                audioUrl={`http://127.0.0.1:5000/audios/${audioname}`}
                                startTime={timeToSeconds(split.startTime)}
                                endTime={timeToSeconds(split.endTime)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
            {showTimeSeries && (
              <Plot
                data={[
                  {
                    x: ["0:00:00", ...songstimeend],
                    y: ["Not Detected", ...scinames].map((name) =>
                      name === "Not Detected" ? 0 : 1
                    ),
                    mode: "markers",
                    marker: {
                      color: [
                        "green",
                        ...scinames.map((name) =>
                          name === "Anomaly" ? "rgba(255, 0, 0, 0.9)" : "green"
                        ),
                      ],
                      size: 10,
                    },
                    type: "scatter",
                    fill: "tozeroy",
                    fillcolor: "rgba(0, 128, 0, 0.5)",
                    hovertext: ["Not Detected", ...scinames].map(
                      (name, index) => {
                        if (name === "Not Detected") {
                          return "";
                        } else {
                          const startTime =
                            index === 0 ? "0:00:00" : songstimestart[index - 1];
                          const endTime = songstimeend[index - 1];
                          return `Especie: ${name}, Período de Tiempo: (${startTime} - ${endTime})`;
                        }
                      }
                    ),
                  },
                ]}
                layout={{
                  autosize: true,
                  title: "Detección de áves en el audio a lo largo del Tiempo",
                  xaxis: {
                    title: "Tiempo (h:m:s)",
                    rangemode: "tozero",
                  },
                  yaxis: {
                    tickvals: [0, 1],
                    ticktext: ["No Detectado", "Detectado"],
                  },
                  hovermode: "closest",
                }}
                useResizeHandler
                className="w-full h-full"
              />
            )}
          </Container>
        </Fragment>
      ) : (
        <div className="text-center font-bold">
          Cargando datos de audio...<Rotate>🦜</Rotate>
        </div>
      )}
    </div>
  );
}

export default Preview;
