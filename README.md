# 3 tier architecture template
This is a demo template for a 3 tier architecture.

All the files are currently deployed and running and can be accessed on the DNS of the web tier ALB [here](http://production-webalb-1634631816.eu-west-3.elb.amazonaws.com/)

The resources are split as follows:
- infrastructure.yaml contains all the VPC related resources
- webtierresources.yaml contains all web tier resources
- apptierresources.yaml contains all app/backend tier resources
- dbtierresources.yaml contains all db tier resources
- files in /code folder and the Dockerfile use a small node.js setup that runs on the app tier to set up a small API that will fetch a record from the database


Here's how it works:

#### Network setup

There's a VPC with 9 subnets, 3 for each tier and in 3 separate Availaibility Zones:
- one for the web tier
- one for the app tier
- one for the db tier

Each of the 3 is deployed in 3AZs, so technically there are 3 subnets for each tier to keep them highly available since subnets are only AZ resilient

There are public and private subnets in the VPC:
- app tier and db tier subnets are private, which is the default
- web tier is public which means its been set up to use an Internet Gateway. This works by creating a new route table, assigning the subnets that I want to be private into this route table and then creating a route that connects to the internet through the Internet Gateway that's also created in the template

This can be improved by also creating a NAT Gateway and using it for the private subnets so that the app and db tiers have outbound access to the internet but continue to stay private to outside connections. This would be beneficial so that things like updates or external API calls could be easily set up in the private subnet resources. But I chose to not do this because this falls outside of the free tier of AWS and I wanted to have all my resources deployed and running as well, but also the cost to stay as low as possible.

#### Web tier

The web tier creates the following resources:
- a set of EC2 instances which mimic a potential front end setup. They sit behind an auto scaling group which takes care of having the right app size at all times, ensuring that the app has the right compute capacity and improving scalability and availability. It also makes sure that all instances are healthy and replaces the unhealthy ones when needed. In my demo app I have 3 instances so they are split across the 3 availability zones, so across the 3 public subnets
- a launch template which makes setting up EC2 instances easier within the auto scaling group by just creating a reusable template that is used across multiple EC2 instances set ups. Inside the launch template I added a UserData script which installs https and echos a few lines into an html page to have a visual representation of the web tier, of the backend connection and of the API call from the backend into the web tier interface.
- an Application Load Balancer(ALB) which has a Target group attached. the target group checks the health of the instances using a specific port(in this case, port 80) and the ALB ensures a single entry point into the web app through its DNS and it insures that traffic is evently distributed across instances. It also works great with the ASG, adjusting accordingly to the traffic increase or decrease.
- a Security Group which is attached to the ALB. This ensures that connections from the outside can come only to the ALB which then connects to the EC2 instances through the Target Group. a secong SG is attached to the web tier instances, allowing only inbound connections from the ALB and making sure the connection to the front end is only done from the internet through the ALB and not directly to the EC2 instances, which adds another layer of security.

#### App tier

App has a similar set up as the web tier for EC2 instances, ALB, launch template, auto scaling group, but with a few differences:
- all resources are now inside private subnets, meaning there is no connection in or out of those subnets
- the Security Group created here is only allowing traffic from within the VPC itself, and this is why as part of this set up I had to create a Custom AMI that installs Docker and pulls my docker image from Docker Hub so that then I can connect to the database from the App tier EC2 instances. The Custom AMI set up is not in the yaml files because I had to perform it through the AWS Console, but esentially I created an EC2 instance in the public subnet, I installed all the libraries that I needed from the internet, I created the Custom AMI and then that AMI I used as part of the Launch Template of these private EC2 instances. This ensured that Docker was installed, my Docker image was pulled and I could run the docker run command that you can see into the Launch template set up.

#### DB tier

DB tier creates the following:
- a subnet group which groups together the private subnets set up for the DB resources
- a security group which makes sure the DB can be accessed by the App tier SG. Since both the DB and App tiers are in private subnets within the same VPC, they can communicate with each other
- a PostgreSQL database instance

As part of this set up, I connected to the DB tier by SSHing into one of the public EC2 instances and connecting to the DB using a command like this one with my own DB credential:

```psql --host=your-rds-endpoint.amazonaws.com --port=5432 --username=admin --dbname=mydatabase```

and then I ran these commands to create a table and insert a record into the table:

```
-- Create the messages table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL
);

-- Insert a sample record
INSERT INTO messages (message) VALUES ('Hello from the database!');

-- Verify that the record was inserted
SELECT * FROM messages;
```

This ensured that I have a record available in the database that I can then fetch by connecting to the database from my App/Backend tier
