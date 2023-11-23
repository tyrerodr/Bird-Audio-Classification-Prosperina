import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  padding-top: 2rem;
  padding-bottom: 0.5rem;
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

const CenteredAudio = styled.audio`
  display: block;
  margin: 0 auto;
`;

const CenteredImg = styled.img`
  display: block;
  margin: 0 auto;
`;

function AudioDetails({
  audioname,
  images,
  songstimeend,
  class_scientificnames,
  class_commonnames,
}) {
  return (
    <Container className="text-center">
      <h4 className="mb-3 text-4xl">
        <b>File Details</b>
      </h4>
      <Table>
        <tbody>
          <tr>
            <TableHeader>File Name</TableHeader>
            <TableCell>{audioname}</TableCell>
          </tr>
          <tr>
            <TableHeader>Total Audio Time</TableHeader>
            <TableCell>{songstimeend.slice(-1)} h:m:s</TableCell>
          </tr>
          <tr>
            <TableHeader>Audio Uploaded</TableHeader>
            <TableCell>
              <CenteredAudio controls>
                <source
                  src={`http://127.0.0.1:5000/audios/${audioname}`}
                  type="audio/wav"
                />
                Your browser does not support the audio element.
              </CenteredAudio>
            </TableCell>
          </tr>
        </tbody>
      </Table>
      <h4 className="mt-4 mb-3 text-2xl">
        <b>Species Found into Audio</b>
      </h4>
      <Table>
        <thead>
          <tr>
            <TableHeader>Image</TableHeader>
            <TableHeader>Scientific Name</TableHeader>
          </tr>
        </thead>
        <tbody>
          {Object.entries(images).map(([name, url]) => (
            <tr key={name}>
              <TableCell>
                <CenteredImg width={150} height={100} src={url} alt={name} />
              </TableCell>
              <TableCell className="font-italic">
                {name === "Anomaly"
                  ? "Anomaly"
                  : class_scientificnames[class_commonnames.indexOf(name)]}
              </TableCell>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default AudioDetails;
