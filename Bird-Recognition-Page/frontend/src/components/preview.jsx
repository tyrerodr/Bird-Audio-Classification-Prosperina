import React, { Fragment, useEffect, useState } from "react";
import styled from "styled-components";
import { keyframes } from "styled-components";
import Plot from "react-plotly.js";
import "./preview.css";
import "./audioDetails";
import AudioDetails from "./audioDetails";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-direction: row;

  @media (max-width: 1300px) {
    flex-direction: column;
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

const Table = styled.table`
  width: 100%;
  margin-top: 1rem;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  background-color: #4caf50;
  color: #fff;
`;

const TableCell = styled.td`
  border: 1px solid #ddd;
  padding: 8px;
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
            alert("Invalid credentials");
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
          <AudioDetails
            audioname={audioname}
            images={images}
            songstimeend={songstimeend}
            class_scientificnames={class_scientificnames}
            class_commonnames={class_commonnames}
          />
          <Container className="text-center">
            <ButtonContainer>
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
                <span>Download CSV Detections</span>
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
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </svg>
                <span>
                  {showSplits ? "Hide List Detections" : "Show List Detections"}
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
                    ? "Hide Time Serie"
                    : "Time Serie with Detections"}
                </span>
              </button>
            </ButtonContainer>
            {console.log(groupedData)}
            {showSplits &&
              groupedData.map((bird) => (
                <div key={bird.id}>
                  <Table>
                    <thead>
                      <tr>
                        <TableHeader>Specie</TableHeader>
                        <TableHeader>Start Time</TableHeader>
                        <TableHeader>End Time</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {bird.splits.map((split) => (
                        <tr key={split.splitName}>
                          <TableCell>{bird.nameCommPredict}</TableCell>
                          <TableCell>{split.startTime}</TableCell>
                          <TableCell>{split.endTime}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ))}
            {showTimeSeries && (
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
                    fillcolor: "rgba(0, 128, 0, 0.5)",
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
            )}
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
