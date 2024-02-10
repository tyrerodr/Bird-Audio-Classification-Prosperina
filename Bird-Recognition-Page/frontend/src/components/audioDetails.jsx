import React from "react";
import styled from "styled-components";

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

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  padding-top: 2rem;
  padding-bottom: 0.5rem;
`;

const CardContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
`;

const Card = styled.div`
  border: 1px solid #ddd;
  padding: 1rem;
  text-align: center;
`;

const CenteredAudio = styled.audio`
  display: block;
  margin: 0 auto;
`;

const CenteredImg = styled.img`
  display: block;
  margin: 0 auto;
  width: 175px; /* Ancho específico */
  height: 175px; /* Altura específica */
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
        <b>Detalles Generales</b>
      </h4>
      <Table>
        <tbody>
          <tr>
            <TableHeader>Nombre del Audio</TableHeader>
            <TableCell>{audioname}</TableCell>
          </tr>
          <tr>
            <TableHeader>Tiempo total del Audio</TableHeader>
            <TableCell>{songstimeend.slice(-1)} h:m:s</TableCell>
          </tr>
          <tr>
            <TableHeader>Vista previa del Audio</TableHeader>
            <TableCell>
              <CenteredAudio controls>
                <source
                  src={`http://127.0.0.1:5000/audios/${audioname}`}
                  type="audio/wav"
                />
                Su navegador no soporta el elemento audio.
              </CenteredAudio>
            </TableCell>
          </tr>
        </tbody>
      </Table>
      <h4 className="mt-4 mb-3 text-2xl">
        <b>Especies encontradas en el Audio</b>
      </h4>
      <CardContainer>
        {Object.entries(images).map(([name, url]) => (
          <Card key={name}>
            <CenteredImg src={url} alt={name} />
            <p className="font-bold">{name}</p>
            <p className="font-italic">
              {name === "Anomaly"
                ? "Anomaly"
                : class_scientificnames[class_commonnames.indexOf(name)]}
            </p>
          </Card>
        ))}
      </CardContainer>
    </Container>
  );
}

export default AudioDetails;
