import requests

res = requests.get(
    "http://localhost:9999/send",
    headers={
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tX2hhc2giOiJiZWFyZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cCI6MTYx"
    },
    params={
        "seed_phrase": "object abandon because image hamster faint glory fiscal clip upper glory field slender bid abuse ski object fiscal resemble member fiscal fiscal abuse cliff"
    },
    json={
        "receivers": {
            "UQDo8eYrFypI4cCZures4CiGsPXZyyHKR9-f6Vxly60h5gck": "0.01",
            "EQBVp4dc0MpeaasDZwf-0qZwT16PxxiXk326j9yrpb9RbSsM": "0.01",
        }
    },
    timeout=5,
)


# res = requests.get(
#     "http://localhost:9999/createHighloadWallet",
#     headers={
#         "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb29tX2hhc2giOiJiZWFyZXIiLCJ1c2VyX2lkIjoiMTIzNDU2Nzg5MCIsImV4cCI6MTYx"
#     },
#     timeout=5,
# )


print(res)
