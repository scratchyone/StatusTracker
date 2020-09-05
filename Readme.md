# StatusTracker

A basic GraphQL based status tracker backend. Services can be set to online via a POST request to `/ping` containing the secret, and expire after the time set in `config.yaml`. Services can be set to private to only allow their status to be viewed with the secret

## To Start

```powershell
npm install -g db-migrate
npm install
db-migrate up
node main
```

## To Use

To query the status of services, you can use GraphQl. `secret` is optional and allows you to view private services

```graphql
{
  statuses(secret: "SECRET") {
    name
    online
    private
  }
}
```

To update a service, send a POST request to `/ping`

```json
{
  "secret": "SECRET",
  "name": "PROGRAM NAME"
}
```

To add services, modify `config.yaml`
