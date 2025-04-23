import { useState, useEffect } from "react";
import Plot from "react-plotly.js";
import Papa from "papaparse";
import {
  TextField,
  Box,
  CircularProgress,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Card,
  CardContent,
  Grid2 as Grid,
  Paper,
  IconButton,
  Tooltip,
  List,
  ListItem,
  Chip,
  OutlinedInput,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";

const CsvList = ({ data }) => {
  return (
    <Box sx={{ maxHeight: "200px", overflowY: "auto" }}>
      <List>
        {data.map((item) => (
          <ListItem
            sx={{
              backgroundColor: "#f5f5f5",
              borderRadius: 1,
              mb: 0.5,
              "&:hover": {
                backgroundColor: "primary.highlight",
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{ fontSize: "0.8rem", textAlign: "left" }}
              key={item}
            >
              {item}
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

const Sandbox = ({ token }) => {
  const [plotData, setPlotData] = useState([]);
  const [plotLayouts, setPlotLayouts] = useState([{}]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [visualizationType, setVisualizationType] = useState("bar");
  const [graphMetrics, setGraphMetrics] = useState(["area_fraction"]);
  const [summary, setSummary] = useState({});
  const [availableCsvs, setAvailableCsvs] = useState([]);
  const [topN, setTopN] = useState(20);
  const [sorted, setSorted] = useState(false);

  const availableMetrics = [
    { value: "area_fraction", label: "Area Fraction" },
    { value: "object_count", label: "Object Count" },
    { value: "pixel_count", label: "Pixel Count" },
    { value: "region_area", label: "Region Area" },
  ];

  const csvSourceUrl =
    "https://data-proxy.ebrains.eu/api/v1/buckets/rwb-arda2014/new_project/kain/pynutil_results/4_4_25/whole_series_report/counts.csv?redirect=false";

  useEffect(() => {
    setAvailableCsvs([csvSourceUrl, "other stuff"]);
  }, []);

  const fetchCSVData = async () => {
    if (!token) {
      setError("Authentication token is missing.");
      console.error("Authentication token is missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setPlotData([]);
    setSummary({});

    try {
      // Fetch the signed URL for the CSV
      const signedUrlResponse = await fetch(csvSourceUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!signedUrlResponse.ok) {
        throw new Error(
          `Failed to get signed URL: ${signedUrlResponse.statusText}`
        );
      }

      const signedUrlData = await signedUrlResponse.json();
      const downloadUrl = signedUrlData.url;

      if (!downloadUrl) {
        throw new Error("Signed URL not found in response.");
      }

      //  the actual CSV content using the signed URL
      const csvResponse = await fetch(downloadUrl);
      if (!csvResponse.ok) {
        throw new Error(`Failed to download CSV: ${csvResponse.statusText}`);
      }
      const csvText = await csvResponse.text();

      // Parse the CSV data
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            throw new Error(`CSV Parsing Error: ${results.errors[0].message}`);
          }
          if (!results.data || results.data.length === 0) {
            throw new Error("CSV data is empty or invalid.");
          }
          console.log("Parsed CSV data:", results.data);
          setRawData(results.data);
          generateAllGraphs(
            results.data,
            graphMetrics,
            visualizationType,
            topN
          );
        },
        error: (err) => {
          throw new Error(`CSV Parsing Failed: ${err.message}`);
        },
      });
    } catch (err) {
      console.error("Error fetching or plotting CSV:", err);
      setError(err.message);
      setPlotData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAllGraphs = (data, metrics, plotType, currentTopN) => {
    const allPlotData = [];
    const allLayouts = [];
    const summaryData = {};

    metrics.forEach((metric, index) => {
      const { plotDataItem, layout, metricSummary } = generatePlot(
        data,
        metric,
        plotType,
        index,
        currentTopN
      );
      allPlotData.push(plotDataItem);
      allLayouts.push(layout);
      summaryData[metric] = metricSummary;
    });

    setPlotData(allPlotData);
    setPlotLayouts(allLayouts);
    setSummary(summaryData);
  };

  const generatePlot = (data, sortField, plotType, index, currentTopN) => {
    // Filter out rows with no data
    const filteredData = data.filter(
      (row) =>
        // Certain meta rows are excluded from the analysis
        row.name !== "Clear Label" &&
        row.name !== "root" &&
        row[sortField] !== undefined &&
        row[sortField] !== null &&
        row[sortField] !== 0
    );

    if (filteredData.length === 0) {
      setError(`No non-zero data found for ${sortField}`);
      return { plotDataItem: [], layout: {}, metricSummary: {} };
    }

    // Sort data by the selected field
    const sortedData = [...filteredData].sort(
      (a, b) => b[sortField] - a[sortField]
    );

    const topData = sorted
      ? sortedData.slice(0, currentTopN)
      : filteredData.slice(0, currentTopN);
    const names = topData.map((row) => row.name);
    const values = topData.map((row) => row[sortField]);

    // Generate colors from RGB values in the data
    const colors = topData.map(
      (row) => `rgba(${row.r}, ${row.g}, ${row.b}, 0.8)`
    ); // Alpha can be adjusted later on

    let plotDataItem;
    if (plotType === "bar") {
      plotDataItem = names.map((name, i) => ({
        y: [name],
        x: [values[i]],
        type: "bar",
        orientation: "h",
        marker: { color: colors[i] },
        name: name, // This will show in the legend
        hovertemplate:
          "<b>%{x}</b><br>" +
          `${sortField}: %{y}<br>` +
          "RGB: %{marker.color}<extra></extra>",
        showlegend: true,
        legendgroup: name,
      }));
    } else if (plotType === "pie") {
      plotDataItem = {
        labels: names,
        values: values,
        type: "pie",
        marker: { colors: colors },
        textinfo: "label+percent",
        hoverinfo: "label+value+percent",
      };
    } else if (plotType === "treemap") {
      plotDataItem = {
        type: "treemap",
        labels: names,
        parents: new Array(names.length).fill(""),
        values: values,
        marker: { colors: colors },
        hovertemplate:
          "<b>%{label}</b><br>" + `${sortField}: %{value}<extra></extra>`,
      };
    }

    // the labels for the regions aren't visible when they are in bar chart format
    const leftMargin = plotType === "bar" ? 250 : 50;

    const metricLabel =
      availableMetrics.find((m) => m.value === sortField)?.label || sortField;
    const layout = {
      title: { text: `${metricLabel} Distribution` },
      automargin: true,
      xaxis: {
        title: "",
        tickangle: 0,
        showgrid: false,
      },
      yaxis: {
        title: metricLabel,
        showgrid: true,
      },
      showlegend: true,
      /*legend: {
        orientation: "v",
        x: 1.02,
        y: 1,
        xanchor: "left",
        yanchor: "top",
        font: { size: 12 },
        bgcolor: "rgba(255,255,255,0.7)",
        bordercolor: "#ccc",
        borderwidth: 1,
        borderRadius: 5,
      },*/
      autosize: true,
      margin: {
        l: leftMargin,
        r: 50,
        b: 130,
        t: 50,
        pad: 4,
      },
      height: 500,
    };

    // Generate summary data for this metric
    const metricSummary = {
      total: filteredData
        .reduce((sum, row) => sum + row[sortField], 0)
        .toFixed(2),
      max: {
        value: topData[0]?.[sortField]?.toFixed(2) || 0,
        region: topData[0]?.name || "None",
      },
      topRegions: topData.slice(0, 3).map((row) => ({
        name: row.name,
        value: row[sortField]?.toFixed(2) || 0,
      })),
    };

    return { plotDataItem, layout, metricSummary };
  };

  // Bunch of handlers for the UI elements
  const handleVisualizationTypeChange = (e) => {
    setVisualizationType(e.target.value);
    if (rawData.length > 0) {
      generateAllGraphs(rawData, graphMetrics, e.target.value, topN);
    }
  };

  const handleMetricsChange = (event) => {
    const selectedMetrics = event.target.value;
    setGraphMetrics(selectedMetrics);

    if (rawData.length > 0) {
      generateAllGraphs(rawData, selectedMetrics, visualizationType, topN);
    }
  };

  const handleTopNChange = (event) => {
    const newTopN = event.target.value;
    setTopN(newTopN);
    if (rawData.length > 0) {
      generateAllGraphs(rawData, graphMetrics, visualizationType, newTopN);
    }
  };

  const handleSortChange = (event) => {
    const newSort = event.target.checked;
    setSorted(newSort);
    if (rawData.length > 0) {
      generateAllGraphs(rawData, graphMetrics, visualizationType, topN);
    }
  };

  useEffect(() => {
    // Initialize with default metrics of area_fraction
    setGraphMetrics(["area_fraction"]);
  }, []);

  return (
    <Box sx={{ padding: 1, backgroundColor: "#fff" }}>
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 1 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={4}>
            <Typography variant="body2" gutterBottom textAlign={"left"}>
              Available quantification results in project
            </Typography>
            <CsvList data={availableCsvs} />
          </Grid>
          <Grid size={4}>
            <Stack
              direction="column"
              spacing={2}
              alignItems="left"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" textAlign={"left"}>
                Plotting and Analysis Summary for brain.name
              </Typography>

              <Box
                sx={{
                  borderTop: "1px dashed #ccc",
                  pt: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                  maxWidth: "100%",
                }}
              >
                <FormControl size="small" sx={{ minWidth: 120, flexGrow: 1 }}>
                  <InputLabel>Chart Type</InputLabel>
                  <Select
                    value={visualizationType}
                    label="Chart Type"
                    onChange={handleVisualizationTypeChange}
                    disabled={isLoading || rawData.length === 0}
                  >
                    <MenuItem value="bar">Bar Chart</MenuItem>
                    <MenuItem value="pie">Pie Chart</MenuItem>
                    <MenuItem value="treemap">Treemap</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Checkbox
                      onChange={handleSortChange}
                      defaultChecked={sorted}
                    />
                  }
                  label="Sorted"
                ></FormControlLabel>

                <FormControl size="small" sx={{ minWidth: 80, flexGrow: 1 }}>
                  <TextField
                    label="Top N"
                    type="number"
                    value={topN}
                    onChange={handleTopNChange}
                    size="small"
                    InputProps={{ inputProps: { min: 1 } }}
                    disabled={isLoading || rawData.length === 0}
                    sx={{ maxWidth: "80px" }}
                  />
                </FormControl>
                <Tooltip title="Load Data">
                  <IconButton
                    color="primary"
                    onClick={fetchCSVData}
                    disabled={isLoading || !token}
                    sx={{ ml: 1 }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <RefreshIcon />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Download All Results">
                  <IconButton
                    color="primary"
                    disabled={!rawData.length || isLoading || true}
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl size="medium" sx={{ minWidth: 200 }}>
                <InputLabel id="metrics-multiple-chip-label">
                  Metrics
                </InputLabel>
                <Select
                  labelId="metrics-multiple-chip-label"
                  id="metrics-multiple-chip"
                  multiple
                  value={graphMetrics}
                  onChange={handleMetricsChange}
                  input={
                    <OutlinedInput id="select-multiple-chip" label="Metrics" />
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={
                            availableMetrics.find((m) => m.value === value)
                              ?.label || value
                          }
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                  disabled={isLoading}
                >
                  {availableMetrics.map((metric) => (
                    <MenuItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>

          <Grid size={4}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
                <Box
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    overflow: "auto",
                    maxHeight: "150px",
                    textAlign: "left",
                  }}
                >
                  {Object.keys(summary).length > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 2,
                        width: "100%",
                      }}
                    >
                      {Object.entries(summary).map(([metric, data], idx) => {
                        const metricLabel =
                          availableMetrics.find((m) => m.value === metric)
                            ?.label || metric;
                        return (
                          <Box
                            key={idx}
                            sx={{
                              mb: 1,
                              minWidth: "170px",
                              flexGrow: 0,
                              maxWidth: "45%",
                              width: "auto",
                              overflow: "hidden",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="primary"
                              sx={{ fontWeight: "bold", display: "block" }}
                            >
                              {metricLabel}:
                            </Typography>
                            <Box sx={{ pl: 1 }}>
                              <Typography variant="caption" display="block">
                                total: {data.total}
                              </Typography>
                              <Typography variant="caption" display="block">
                                max: {data.max.value} ({data.max.region})
                              </Typography>
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{
                                  wordBreak: "break-word",
                                  whiteSpace: "normal",
                                  overflowWrap: "break-word",
                                }}
                              >
                                top: [
                                {data.topRegions
                                  .map((r) => `${r.name}: ${r.value}`)
                                  .join(", ")}
                                ]
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Load data to see analysis summary
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mt: 1, fontSize: "0.875rem" }}>
            Error: {error}
          </Typography>
        )}
      </Paper>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {plotData.length > 0 && !isLoading && (
        <Box
          sx={{ display: "flex", flexWrap: "wrap", overflow: "auto", gap: 2 }}
        >
          {plotData.map((dataItem, index) => (
            <Box
              key={index}
              sx={{
                flexBasis: plotData.length > 1 ? "calc(50% - 16px)" : "100%",
                minWidth: plotData.length > 1 ? "300px" : "100%",
                flexGrow: 1,
              }}
            >
              <Paper elevation={0} sx={{ p: 2 }}>
                <Plot
                  data={Array.isArray(dataItem) ? dataItem : [dataItem]}
                  layout={plotLayouts[index]}
                  useResizeHandler={true}
                  style={{
                    width: "100%",
                    height: plotData.length > 2 ? "400px" : "500px",
                  }}
                  config={{
                    responsive: true,
                    displayModeBar: true,
                    toImageButtonOptions: {
                      format: "png",
                      filename: `brain_region_${graphMetrics[index]}`,
                      height: 800,
                      width: 1200,
                      scale: 1,
                    },
                  }}
                />
              </Paper>
            </Box>
          ))}
        </Box>
      )}

      {!plotData.length && !isLoading && !error && (
        <Box
          sx={{
            mt: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "70vh",
            border: "1px dashed #ccc",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Click the refresh button to load and visualize brain region data
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Sandbox;
