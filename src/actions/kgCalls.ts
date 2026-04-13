const kgPayloadLocaliZoom = {
    "@context": {
        "@vocab": "https://core.kg.ebrains.eu/vocab/query/",
        "query": "https://schema.hbp.eu/myQuery/",
        "propertyName": {
            "@id": "propertyName",
            "@type": "@id"
        },
        "path": {
            "@id": "path",
            "@type": "@id"
        }
    },
    "meta": {
        "name": "Fetching datasets versions having a LZ link-Copy",
        "responseVocab": "https://schema.hbp.eu/myQuery/",
        "type": "https://openminds.om-i.org/types/Service"
    },
    "structure": [
        {
            "propertyName": "query:name",
            "path": "https://openminds.om-i.org/props/name",
            "required": true,
            "sort": true,
            "filter": {
                "op": "CONTAINS",
                "value": "LocaliZoom"
            }
        },
        {
            "propertyName": "query:isUsedFor",
            "path": {
                "@id": "https://openminds.om-i.org/props/service",
                "reverse": true
            },
            "structure": [
                {
                    "propertyName": "query:serviceLink",
                    "path": "https://openminds.om-i.org/props/openDataIn"
                },
                {
                    "propertyName": "query:dataSource",
                    "path": [
                        {
                            "@id": "https://openminds.om-i.org/props/dataLocation",
                            "typeFilter": {
                                "@id": "https://openminds.om-i.org/types/FileBundle"
                            }
                        },
                        {
                            "@id": "https://openminds.om-i.org/props/isPartOf",
                            "typeFilter": {
                                "@id": "https://openminds.om-i.org/types/FileRepository"
                            }
                        },
                        {
                            "@id": "https://openminds.om-i.org/props/repository",
                            "reverse": true,
                            "typeFilter": {
                                "@id": "https://openminds.om-i.org/types/DatasetVersion"
                            }
                        }
                    ],
                    "structure": [
                        {
                            "propertyName": "query:description",
                            "path": "https://openminds.om-i.org/props/description"
                        },
                        {
                            "propertyName": "query:fullName",
                            "path": "https://openminds.om-i.org/props/fullName"
                        },
                        {
                            "propertyName": "query:shortName",
                            "path": "https://openminds.om-i.org/props/shortName"
                        },
                        {
                            "propertyName": "query:versionInnovation",
                            "path": "https://openminds.om-i.org/props/versionInnovation"
                        },
                        {
                            "propertyName": "query:versionIdentifier",
                            "path": "https://openminds.om-i.org/props/versionIdentifier"
                        },
                        {
                            "propertyName": "query:digitalIdentifier",
                            "path": [
                                "https://openminds.om-i.org/props/digitalIdentifier",
                                "https://openminds.om-i.org/props/identifier"
                            ]
                        },
                        {
                            "propertyName": "query:hasVersion",
                            "path": {
                                "@id": "https://openminds.om-i.org/props/hasVersion",
                                "reverse": true
                            },
                            "structure": [
                                {
                                    "propertyName": "query:fullName",
                                    "path": "https://openminds.om-i.org/props/fullName"
                                },
                                {
                                    "propertyName": "query:shortName",
                                    "path": "https://openminds.om-i.org/props/shortName"
                                },
                                {
                                    "propertyName": "query:description",
                                    "path": "https://openminds.om-i.org/props/description"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

// --- Types ---

interface DataSource {
    digitalIdentifier?: string[];
    versionInnovation?: string;
    shortName?: string;
    versionIdentifier?: string;
    fullName?: string;
    description?: string;
    hasVersion?: {
        shortName?: string;
        fullName?: string;
        description?: string;
    }[];
}

interface ServiceEntry {
    serviceLink: string;
    dataSource?: DataSource[];
}

interface KGResponseItem {
    "@context": { "@vocab": string };
    isUsedFor: ServiceEntry[];
}

interface KGResponse {
    data: KGResponseItem[];
    total?: number;
    size?: number;
    from?: number;
}

export interface ParsedDataset {
    doi: string;
    shortName: string;
    fullName: string;
    versionIdentifier: string;
    versionInnovation: string;
    description: string;
    serviceLinks: string[];
}

// --- Fetcher ---

const getKGData = async (payload: object, token?: string, size = 500, from = 0): Promise<KGResponse> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(
        `https://createzoom.apps.ebrains.eu/api/kg/queries?size=${size}&from=${from}&stage=RELEASED`,
        {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        throw new Error(`KG query failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
};

// --- Parser ---

export const parseKGResponse = (response: KGResponse): Map<string, ParsedDataset> => {
    const map = new Map<string, ParsedDataset>();

    for (const item of response.data) {
        for (const entry of item.isUsedFor ?? []) {
            const { serviceLink, dataSource } = entry;
            if (!serviceLink || !dataSource?.length) continue;

            const src = dataSource[0];
            const doi = src.digitalIdentifier?.[0];
            if (!doi) continue;

            // Prefer hasVersion for name/description when dataSource fields are empty
            const parent = src.hasVersion?.[0];
            const shortName = src.shortName || parent?.shortName || "";
            const fullName = src.fullName || parent?.fullName || "";
            const description = src.description || parent?.description || "";

            if (map.has(doi)) {
                map.get(doi)!.serviceLinks.push(serviceLink);
            } else {
                map.set(doi, {
                    doi,
                    shortName,
                    fullName,
                    versionIdentifier: src.versionIdentifier ?? "",
                    versionInnovation: src.versionInnovation ?? "",
                    description,
                    serviceLinks: [serviceLink],
                });
            }
        }
    }

    return map;
};

// --- Public API ---

export const fetchLocaliZoomDatasets = async (token?: string): Promise<Map<string, ParsedDataset>> => {
    const response = await getKGData(kgPayloadLocaliZoom, token);
    return parseKGResponse(response);
};
