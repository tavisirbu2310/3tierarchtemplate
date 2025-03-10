# 3 tier architecture template
This is a demo template for a 3 tier architecture.

All the files are currently deployed and running and can be accessed on the DNS of the web tier ALB [here](http://production-webalb-1634631816.eu-west-3.elb.amazonaws.com/)

The resources are split as follows:
- infrastructure.yaml contains all the VPC related resources
- webtierresources.yaml contains all web tier resources
- apptierresources.yaml contains all app/backend tier resources
- dbtierresources.yaml contains all db tier resources
- files in /code folder and the Dockerfile use a small node.js setup that runs on the app tier to set up a small API that will fetch a record from the database


