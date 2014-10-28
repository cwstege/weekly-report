var _ = require("lodash");
var moment = require("moment");
var getServer = require("../../../api/server");

var stdizer = function (object) {
  if (object.periodStart) {
    object.periodStart = moment(object.periodStart).toISOString();
  }
  if (object.periodEnd) {
    object.periodEnd = moment(object.periodEnd).toISOString();
  }
  return _.omit(object, ["id", "createdAt", "updatedAt"]);
};

describe("api/routes/reports", function () {
  var server;

  before(function (done) {
    getServer(null, function (err, serverRef) {
      if (err) { throw new Error("surver failed to load"); }

      server = serverRef;
      server.start(done);
    });
  });

  after(function (done) {
    server.stop(done);
  });

  var testSurvey = {
    periodStart: moment("20140101", "YYYYMMDD").toISOString(),
    periodEnd: moment("20140115", "YYYYMMDD").toISOString(),
    projectName: "Foo Project",
    creatorEmail: "creator@gmail.com",
    emails: ["hi@gmail.com", "lo@gmail.com"]
  };

  it("should populate records and respond with survey record", function (done) {
    var survey;

    server.inject({
      method: "POST",
      url: "/surveys",
      payload: testSurvey
    }, function (res) {
      var resBody = JSON.parse(res.payload);
      // Go to db and get record
      var models = server.plugins.sqlModels.models;
      models.Survey.find({
        where: { projectName: testSurvey.projectName }
      })
        .then(function (foundSurvey) {
          survey = foundSurvey;
          return models.Response.findAll({
            where: { SurveyId: survey.dataValues.id }
          });
        })
        .then(function (response) {
          test.done(done, function () {
            expect(res.statusCode).to.equal(200);
            expect(stdizer(resBody.newSurvey))
              .to.deep.equal(_.omit(testSurvey, "emails"));
            expect(stdizer(survey.dataValues))
              .to.deep.equal(_.omit(testSurvey, "emails"));
            expect(response[0].dataValues.email)
              .to.equal(testSurvey.emails[0]);
            expect(response[1].dataValues.email)
              .to.equal(testSurvey.emails[1]);
          });
        });
    });
  });
});
